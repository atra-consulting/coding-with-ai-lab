import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, pairwise, startWith } from 'rxjs/operators';
import {
  DEFAULT_DURATIONS,
  PROZESS_ROLLEN,
  PROZESSE,
  ProzessKey,
  Rolle,
} from '../../core/models/prozess-defaults';
import {
  PROZESS_SZENARIO_FELD,
  ProzessDauer,
  Szenario,
  SzenarioCreate,
} from '../../core/models/szenario.model';
import { NotificationService } from '../../core/services/notification.service';
import { SzenarioService } from '../../core/services/szenario.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { DauerPipe, minutenZuDauer } from '../../shared/pipes/dauer.pipe';
import {
  ZEITEINHEITEN,
  ZeitEinheit,
  durationValidatorsFor,
  einheitZuFaktor,
  feldWertZuMinuten,
  maxWertFuerEinheit,
} from './einheit';
import { computeComparisonBars, computeSegments, SvgSegment } from './svg-util';

interface ProzessSnapshot {
  works: number[];
  waits: number[];
  total: number;
}

interface SvgSnapshot {
  prozesse: ProzessSnapshot[];
  maxTotal: number;
}

/** Builds the initial per-process snapshot Record straight from DEFAULT_DURATIONS. */
function baueInitialeProzessDaten(): Record<ProzessKey, ProzessSnapshot> {
  const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);
  const daten = {} as Record<ProzessKey, ProzessSnapshot>;
  for (const p of PROZESSE) {
    const d = DEFAULT_DURATIONS[p.key];
    daten[p.key] = { works: d.works, waits: d.waits, total: sum(d.works) + sum(d.waits) };
  }
  return daten;
}

@Component({
  selector: 'app-rechner',
  imports: [ReactiveFormsModule, FormsModule, NgbNavModule, NgbTooltipModule, NgTemplateOutlet, LoadingSpinnerComponent, DauerPipe],
  templateUrl: './rechner.component.html',
  styles: [
    `
      .input-number {
        width: 80px;
      }
      .step-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .step-label {
        flex: 1;
        min-width: 200px;
      }
      .wait-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-left: 1rem;
        border-left: 2px solid #dee2e6;
        padding-left: 0.75rem;
      }
      .viz-card {
        overflow-x: hidden;
      }
      .process-bar-wrap {
        margin-bottom: 1.25rem;
      }
      .process-bar-wrap:last-child {
        margin-bottom: 0;
      }
      .bar-label-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.25rem;
      }
      .bar-title {
        font-weight: 600;
        font-size: 0.9rem;
        color: #264892;
      }
      .bar-total {
        font-size: 0.85rem;
        color: #495057;
      }
      .process-svg {
        display: block;
        width: 100%;
        height: 32px;
        overflow: hidden;
      }
      .comparison-svg {
        display: block;
        width: 100%;
        overflow: visible;
      }
      .seg-rect:focus-visible {
        outline: 3px solid #264892;
        outline-offset: 2px;
      }
      .seg-rect {
        cursor: pointer;
      }
    `,
  ],
})
export class RechnerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private szenarioService = inject(SzenarioService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  readonly prozesse = PROZESSE;
  readonly zeiteinheiten: ZeitEinheit[] = ZEITEINHEITEN;

  activeTab = 1;
  nameInput = '';
  nameError: string | null = null;

  // Scenario state
  szenarien = signal<Szenario[]>([]);
  geladenSzenario = signal<Szenario | null>(null);
  scenarioLoading = signal(false);
  scenarioError = signal<string | null>(null);

  /** Balken/Flussdiagramm toggle per process tab (set by ui-designer's toggle). Reset to 'balken' on tab change + scenario load. */
  private viewModeSignal = signal<'balken' | 'flussdiagramm'>('balken');
  readonly viewMode = this.viewModeSignal.asReadonly();

  /** Guards the unit-conversion pipeline against firing while a scenario is being patched in. */
  private isLoading = signal(false);

  // One Record<ProzessKey, ProzessSnapshot> holds works/waits/total for all four processes.
  private prozessDaten = signal<Record<ProzessKey, ProzessSnapshot>>(baueInitialeProzessDaten());

  svgSnapshot = computed<SvgSnapshot>(() => {
    const daten = this.prozessDaten();
    const prozesse = PROZESSE.map((p) => daten[p.key]);
    const maxTotal = Math.max(...prozesse.map((p) => p.total), 0);
    return { prozesse, maxTotal };
  });

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.baueFormular();

    // Initial calculation
    this.berechne(this.form.value);

    // Live recalculation
    this.form.valueChanges
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.berechne(val));

    this.ladeSzenarien();
  }

  /** Resets the Balken/Flussdiagramm toggle when the user switches tabs. */
  onNavChange(): void {
    this.viewModeSignal.set('balken');
  }

  /** Setter for ui-designer's upcoming toggle. */
  setViewMode(mode: 'balken' | 'flussdiagramm'): void {
    this.viewModeSignal.set(mode);
  }

  toggleView(): void {
    this.viewModeSignal.update((m) => (m === 'balken' ? 'flussdiagramm' : 'balken'));
  }

  private baueFormular(): FormGroup {
    const gruppen: Record<string, FormGroup> = {};
    for (const p of PROZESSE) {
      gruppen[p.key] = this.fb.group({
        works: this.fb.array(this.baueSchrittArray(DEFAULT_DURATIONS[p.key].works)),
        waits: this.fb.array(this.baueSchrittArray(DEFAULT_DURATIONS[p.key].waits)),
      });
    }
    return this.fb.group(gruppen);
  }

  private baueSchrittArray(minutes: number[]): FormGroup[] {
    return minutes.map((min) => {
      const group = this.fb.group({
        value: [min, durationValidatorsFor('Minuten')],
        unit: ['Minuten'],
      });
      this.wireUnitConversion(group);
      return group;
    });
  }

  /**
   * Subscribes to a step group's unit control so switching units converts the value
   * in place (R5). Uses startWith + pairwise to see [prev, cur] on every change, and
   * is skipped entirely while a scenario is loading (isLoading guard + the load
   * path's own {emitEvent:false} patches).
   */
  private wireUnitConversion(group: FormGroup): void {
    const unitCtrl = group.get('unit') as FormControl<ZeitEinheit>;
    const valueCtrl = group.get('value') as FormControl<number>;

    unitCtrl.valueChanges
      .pipe(
        startWith(unitCtrl.value),
        pairwise(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([prev, cur]) => {
        if (this.isLoading() || prev === cur) return;

        const minuten = feldWertZuMinuten(valueCtrl.value ?? 0, prev);
        const konvertiert = minuten / einheitZuFaktor(cur);
        const gerundet = Math.round(konvertiert * 100) / 100;

        valueCtrl.patchValue(gerundet);
        valueCtrl.setValidators(durationValidatorsFor(cur));
        valueCtrl.updateValueAndValidity();
      });
  }

  private berechne(val: ReturnType<FormGroup['getRawValue']>): void {
    const toMinutes = (groups: { value: number; unit: ZeitEinheit }[]) =>
      groups.map((g) => Math.round((g.value ?? 0) * einheitZuFaktor(g.unit ?? 'Minuten')));
    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

    const daten = {} as Record<ProzessKey, ProzessSnapshot>;
    for (const p of PROZESSE) {
      const works = toMinutes(val[p.key]?.works ?? []);
      const waits = toMinutes(val[p.key]?.waits ?? []);
      daten[p.key] = { works, waits, total: sum(works) + sum(waits) };
    }
    this.prozessDaten.set(daten);
  }

  // FormArray accessors
  getWorksArray(prozessKey: ProzessKey): FormArray {
    return (this.form.get(prozessKey) as FormGroup).get('works') as FormArray;
  }

  getWaitsArray(prozessKey: ProzessKey): FormArray {
    return (this.form.get(prozessKey) as FormGroup).get('waits') as FormArray;
  }

  asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  asFormControl(ctrl: AbstractControl): FormControl {
    return ctrl as FormControl;
  }

  /** Gets the 'value' FormControl from a step group (AbstractControl). */
  getValueCtrl(ctrl: AbstractControl): FormControl {
    return (ctrl as FormGroup).get('value') as FormControl;
  }

  /** Gets the 'unit' FormControl from a step group (AbstractControl). */
  getUnitCtrl(ctrl: AbstractControl): FormControl {
    return (ctrl as FormGroup).get('unit') as FormControl;
  }

  /** Current max allowed value for a step group's value input — depends on its own unit. */
  getValueMax(ctrl: AbstractControl): number {
    const unit = (this.getUnitCtrl(ctrl).value as ZeitEinheit) ?? 'Minuten';
    return maxWertFuerEinheit(unit);
  }

  /** Gets the 'value' FormControl from the waits array by index and process key. */
  getWaitValueCtrl(prozessKey: ProzessKey, index: number): FormControl {
    return this.getWaitsArray(prozessKey).at(index).get('value') as FormControl;
  }

  /** Gets the 'unit' FormControl from the waits array by index and process key. */
  getWaitUnitCtrl(prozessKey: ProzessKey, index: number): FormControl {
    return this.getWaitsArray(prozessKey).at(index).get('unit') as FormControl;
  }

  /** Current max allowed value for a wait step's value input — depends on its own unit. */
  getWaitValueMax(prozessKey: ProzessKey, index: number): number {
    const unit = (this.getWaitUnitCtrl(prozessKey, index).value as ZeitEinheit) ?? 'Minuten';
    return maxWertFuerEinheit(unit);
  }

  // Scenario CRUD
  ladeSzenarien(): void {
    this.scenarioLoading.set(true);
    this.szenarioService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (list) => {
        this.szenarien.set(list);
        this.scenarioLoading.set(false);
      },
      error: () => {
        this.scenarioError.set('Fehler beim Laden der Szenarien.');
        this.scenarioLoading.set(false);
      },
    });
  }

  ladeScenario(s: Szenario): void {
    this.geladenSzenario.set(s);
    this.nameInput = s.name;
    this.nameError = null;

    this.isLoading.set(true);
    for (const p of PROZESSE) {
      const feld = PROZESS_SZENARIO_FELD[p.key];
      const stored: ProzessDauer | undefined = s[feld];
      const quelle =
        stored && stored.works.length === p.stepCount ? stored : DEFAULT_DURATIONS[p.key];
      this.patchProzessArray(p.key, quelle.works, quelle.waits);
    }
    this.isLoading.set(false);

    // The {emitEvent:false} patches above suppress form.valueChanges → berechne(),
    // so recompute explicitly. Required for the tabs/bars/pies to reflect the load.
    this.berechne(this.form.getRawValue());

    this.viewModeSignal.set('balken');
  }

  private patchProzessArray(key: ProzessKey, works: number[], waits: number[]): void {
    const worksArray = this.getWorksArray(key);
    const waitsArray = this.getWaitsArray(key);

    const patchSchritt = (ctrl: AbstractControl | null, min: number) => {
      if (!ctrl) return;
      ctrl.patchValue({ value: min, unit: 'Minuten' }, { emitEvent: false });
      // A field left on "Tage" (max 999) before the load stays capped there unless
      // its max validator is reset back to the Minuten factory.
      const valueCtrl = this.getValueCtrl(ctrl);
      valueCtrl.setValidators(durationValidatorsFor('Minuten'));
      valueCtrl.updateValueAndValidity({ emitEvent: false });
    };

    works.forEach((min, i) => patchSchritt(worksArray.at(i), min));
    waits.forEach((min, i) => patchSchritt(waitsArray.at(i), min));
  }

  private formZuPayload(): SzenarioCreate {
    const toMinutesArr = (groups: { value: number; unit: ZeitEinheit }[]) =>
      groups.map((g) => Math.round((g.value ?? 0) * einheitZuFaktor(g.unit ?? 'Minuten')));

    const val = this.form.value;
    const steps: Partial<Record<ProzessKey, ProzessDauer>> = {};
    for (const p of PROZESSE) {
      steps[p.key] = {
        works: toMinutesArr(val[p.key].works),
        waits: toMinutesArr(val[p.key].waits),
      };
    }

    return {
      name: this.nameInput.trim(),
      humanSteps: steps.menschlich as ProzessDauer,
      agileKiSteps: steps.agileKi as ProzessDauer,
      semiAutomatedSteps: steps.halbautomatisch as ProzessDauer,
      automatedSteps: steps.vollautomatisch as ProzessDauer,
    };
  }

  neuSpeichern(): void {
    if (this.form.invalid || this.scenarioLoading()) return;
    this.nameError = null;
    if (!this.nameInput.trim()) {
      this.nameError = 'Name ist erforderlich.';
      return;
    }
    const payload = this.formZuPayload();
    this.scenarioLoading.set(true);
    this.szenarioService.create(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (neu) => {
        this.szenarien.update((list) => [neu, ...list]);
        this.geladenSzenario.set(neu);
        this.scenarioLoading.set(false);
        this.notification.success('Szenario gespeichert.');
      },
      error: (err) => {
        this.scenarioLoading.set(false);
        if (err?.error?.fieldErrors?.name) {
          this.nameError = err.error.fieldErrors.name;
        } else {
          this.notification.error('Fehler beim Speichern des Szenarios.');
        }
      },
    });
  }

  aktualisieren(): void {
    const loaded = this.geladenSzenario();
    if (!loaded || this.form.invalid || this.scenarioLoading()) return;
    this.nameError = null;
    const payload = this.formZuPayload();
    this.scenarioLoading.set(true);
    this.szenarioService.update(loaded.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.szenarien.update((list) =>
          list.map((s) => (s.id === updated.id ? updated : s)),
        );
        this.geladenSzenario.set(updated);
        this.scenarioLoading.set(false);
        this.notification.success('Szenario aktualisiert.');
      },
      error: (err) => {
        this.scenarioLoading.set(false);
        if (err?.error?.fieldErrors?.name) {
          this.nameError = err.error.fieldErrors.name;
        } else {
          this.notification.error('Fehler beim Aktualisieren des Szenarios.');
        }
      },
    });
  }

  alsNeuSpeichern(): void {
    if (this.form.invalid || this.scenarioLoading()) return;
    this.nameError = null;
    if (!this.nameInput.trim()) {
      this.nameError = 'Name ist erforderlich.';
      return;
    }
    const payload = this.formZuPayload();
    this.scenarioLoading.set(true);
    this.szenarioService.create(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (neu) => {
        this.szenarien.update((list) => [neu, ...list]);
        this.geladenSzenario.set(neu);
        this.scenarioLoading.set(false);
        this.notification.success('Als neues Szenario gespeichert.');
      },
      error: (err) => {
        this.scenarioLoading.set(false);
        if (err?.error?.fieldErrors?.name) {
          this.nameError = err.error.fieldErrors.name;
        } else {
          this.notification.error('Fehler beim Speichern des Szenarios.');
        }
      },
    });
  }

  loeschen(s: Szenario): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Szenario löschen';
    modalRef.componentInstance.message = `Möchten Sie das Szenario „${s.name}" wirklich löschen?`;
    modalRef.componentInstance.confirmText = 'Löschen';
    modalRef.result.then(
      () => {
        this.scenarioLoading.set(true);
        this.szenarioService.delete(s.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.szenarien.update((list) => list.filter((x) => x.id !== s.id));
            if (this.geladenSzenario()?.id === s.id) {
              this.geladenSzenario.set(null);
            }
            this.scenarioLoading.set(false);
            this.notification.success('Szenario gelöscht.');
          },
          error: () => {
            this.scenarioLoading.set(false);
            this.notification.error('Fehler beim Löschen des Szenarios.');
          },
        });
      },
      () => {
        // dismissed — no action
      },
    );
  }

  // Helper for the template
  getProzessTotal(index: number): number {
    return this.svgSnapshot().prozesse[index]?.total ?? 0;
  }

  getComparisonBars(containerWidth: number): { width: number }[] {
    const totals = this.svgSnapshot().prozesse.map((p) => p.total);
    return computeComparisonBars(totals, containerWidth);
  }

  getSegments(prozessIndex: number, containerWidth: number): SvgSegment[] {
    const snap = this.svgSnapshot().prozesse[prozessIndex];
    return computeSegments(snap.works, snap.waits, containerWidth);
  }

  /** Tooltip text for a wait segment. */
  getWaitTooltip(prozessIndex: number, stepIndex: number): string {
    const snap = this.svgSnapshot().prozesse[prozessIndex];
    const waitMin = snap.waits[stepIndex] ?? 0;
    return `Wartezeit nach Schritt ${stepIndex + 1}: ${minutenZuDauer(waitMin)}`;
  }

  /** Builds the label/tooltip text for a work rect. */
  getWorkAriaLabel(prozessIndex: number, stepIndex: number): string {
    const snap = this.svgSnapshot().prozesse[prozessIndex];
    const label = this.prozesse[prozessIndex]?.labels[stepIndex] ?? `Schritt ${stepIndex + 1}`;
    const workMin = snap.works[stepIndex] ?? 0;
    const waitMin = snap.waits[stepIndex] ?? null;
    let s = `Schritt ${stepIndex + 1}: ${label}. Arbeitszeit: ${minutenZuDauer(workMin)}`;
    if (waitMin !== null) {
      s += `. Folgende Wartezeit: ${minutenZuDauer(waitMin)}`;
    }
    return s;
  }

  // ── Chart data helpers (4.6) — data only; ui-designer wires these into pies/flowchart ──

  /** Work vs. wait totals (minutes) for a process — Pie A input. */
  getWorkWaitTotals(index: number): { work: number; wait: number } {
    const snap = this.svgSnapshot().prozesse[index];
    if (!snap) return { work: 0, wait: 0 };
    return {
      work: snap.works.reduce((s, v) => s + v, 0),
      wait: snap.waits.reduce((s, v) => s + v, 0),
    };
  }

  /** 'Arbeitszeit' for the two agile processes, 'KI-Arbeitszeit' for the two KI processes. */
  getArbeitszeitLabel(index: number): string {
    return this.prozesse[index]?.arbeitszeitLabel ?? 'Arbeitszeit';
  }

  /**
   * Role split of the work total (minutes), agile processes only — Pie B input.
   * Returns null for the two KI-only processes (halbautomatisch/vollautomatisch),
   * which have no per-step role assignment.
   */
  getRollenSplit(index: number): { ba: number; dev: number; tester: number } | null {
    const key = this.prozesse[index]?.key;
    if (key !== 'menschlich' && key !== 'agileKi') return null;

    const snap = this.svgSnapshot().prozesse[index];
    const rollen = PROZESS_ROLLEN[key];
    const totals: Record<Rolle, number> = { BA: 0, Dev: 0, Tester: 0 };
    snap.works.forEach((min, i) => {
      const rolle = rollen[i];
      if (rolle) totals[rolle] += min;
    });
    return { ba: totals.BA, dev: totals.Dev, tester: totals.Tester };
  }

  /** Per-box data for the flowchart view; the last step has no following wait. */
  getFlowchartSchritte(
    index: number,
  ): { nr: number; label: string; work: number; wait: number | null }[] {
    const snap = this.svgSnapshot().prozesse[index];
    const labels = this.prozesse[index]?.labels ?? [];
    if (!snap) return [];
    return snap.works.map((work, i) => ({
      nr: i + 1,
      label: labels[i] ?? `Schritt ${i + 1}`,
      work,
      wait: i < snap.waits.length ? snap.waits[i] : null,
    }));
  }

  /** Readonly export so template can call minutenZuDauer() */
  readonly formatDuration = minutenZuDauer;
}
