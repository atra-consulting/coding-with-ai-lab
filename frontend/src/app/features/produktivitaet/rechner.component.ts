import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime } from 'rxjs/operators';
import { DEFAULT_DURATIONS, PROZESSE } from '../../core/models/prozess-defaults';
import { Szenario, SzenarioCreate } from '../../core/models/szenario.model';
import { NotificationService } from '../../core/services/notification.service';
import { SzenarioService } from '../../core/services/szenario.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { DauerPipe, minutenZuDauer } from '../../shared/pipes/dauer.pipe';
import { ZEITEINHEITEN, ZeitEinheit, einheitZuFaktor } from './einheit';
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

const DURATION_VALIDATORS = [
  Validators.required,
  Validators.min(0),
  Validators.max(479520),
];

@Component({
  selector: 'app-rechner',
  imports: [ReactiveFormsModule, FormsModule, NgbNavModule, LoadingSpinnerComponent, DauerPipe],
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
      .step-detail-panel {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        margin-top: 0.5rem;
        font-size: 0.85rem;
      }
      .step-detail-panel dt {
        font-weight: 600;
        color: #264892;
      }
      .step-detail-panel dd {
        color: #495057;
        margin-bottom: 0.15rem;
      }
      .work-rect:focus-visible {
        outline: 3px solid #264892;
        outline-offset: 2px;
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

  // Per-process totals (minutes)
  private menschlichTotal = signal(0);
  private halbautomatischTotal = signal(0);
  private vollautomatischTotal = signal(0);

  // Works/waits in minutes for each process (used by SVG)
  private menschlichWorks = signal<number[]>([]);
  private menschlichWaits = signal<number[]>([]);
  private halbautomatischWorks = signal<number[]>([]);
  private halbautomatischWaits = signal<number[]>([]);
  private vollautomatischWorks = signal<number[]>([]);
  private vollautomatischWaits = signal<number[]>([]);

  svgSnapshot = computed<SvgSnapshot>(() => {
    const prozesse: ProzessSnapshot[] = [
      {
        works: this.menschlichWorks(),
        waits: this.menschlichWaits(),
        total: this.menschlichTotal(),
      },
      {
        works: this.halbautomatischWorks(),
        waits: this.halbautomatischWaits(),
        total: this.halbautomatischTotal(),
      },
      {
        works: this.vollautomatischWorks(),
        waits: this.vollautomatischWaits(),
        total: this.vollautomatischTotal(),
      },
    ];
    const maxTotal = Math.max(
      this.menschlichTotal(),
      this.halbautomatischTotal(),
      this.vollautomatischTotal(),
    );
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

  private baueFormular(): FormGroup {
    return this.fb.group({
      menschlich: this.fb.group({
        works: this.fb.array(this.baueSchrittArray(DEFAULT_DURATIONS.menschlich.works)),
        waits: this.fb.array(this.baueSchrittArray(DEFAULT_DURATIONS.menschlich.waits)),
      }),
      halbautomatisch: this.fb.group({
        works: this.fb.array(this.baueSchrittArray(DEFAULT_DURATIONS.halbautomatisch.works)),
        waits: this.fb.array(this.baueSchrittArray(DEFAULT_DURATIONS.halbautomatisch.waits)),
      }),
      vollautomatisch: this.fb.group({
        works: this.fb.array(this.baueSchrittArray(DEFAULT_DURATIONS.vollautomatisch.works)),
        waits: this.fb.array(this.baueSchrittArray(DEFAULT_DURATIONS.vollautomatisch.waits)),
      }),
    });
  }

  private baueSchrittArray(minutes: number[]): FormGroup[] {
    return minutes.map((min) =>
      this.fb.group({
        value: [min, DURATION_VALIDATORS],
        unit: ['Minuten'],
      }),
    );
  }

  private berechne(val: ReturnType<FormGroup['getRawValue']>): void {
    const toMinutes = (groups: { value: number; unit: ZeitEinheit }[]) =>
      groups.map((g) => Math.round((g.value ?? 0) * einheitZuFaktor(g.unit ?? 'Minuten')));

    const mWorks = toMinutes(val['menschlich']?.works ?? []);
    const mWaits = toMinutes(val['menschlich']?.waits ?? []);
    const hWorks = toMinutes(val['halbautomatisch']?.works ?? []);
    const hWaits = toMinutes(val['halbautomatisch']?.waits ?? []);
    const vWorks = toMinutes(val['vollautomatisch']?.works ?? []);
    const vWaits = toMinutes(val['vollautomatisch']?.waits ?? []);

    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

    this.menschlichWorks.set(mWorks);
    this.menschlichWaits.set(mWaits);
    this.halbautomatischWorks.set(hWorks);
    this.halbautomatischWaits.set(hWaits);
    this.vollautomatischWorks.set(vWorks);
    this.vollautomatischWaits.set(vWaits);

    this.menschlichTotal.set(sum(mWorks) + sum(mWaits));
    this.halbautomatischTotal.set(sum(hWorks) + sum(hWaits));
    this.vollautomatischTotal.set(sum(vWorks) + sum(vWaits));
  }

  // FormArray accessors
  getWorksArray(prozessKey: string): FormArray {
    return (this.form.get(prozessKey) as FormGroup).get('works') as FormArray;
  }

  getWaitsArray(prozessKey: string): FormArray {
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

  /** Gets the 'value' FormControl from the waits array by index and process key. */
  getWaitValueCtrl(prozessKey: string, index: number): FormControl {
    return this.getWaitsArray(prozessKey).at(index).get('value') as FormControl;
  }

  /** Gets the 'unit' FormControl from the waits array by index and process key. */
  getWaitUnitCtrl(prozessKey: string, index: number): FormControl {
    return this.getWaitsArray(prozessKey).at(index).get('unit') as FormControl;
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

    this.patchProzessArray('menschlich', s.humanSteps.works, s.humanSteps.waits);
    this.patchProzessArray('halbautomatisch', s.semiAutomatedSteps.works, s.semiAutomatedSteps.waits);
    this.patchProzessArray('vollautomatisch', s.automatedSteps.works, s.automatedSteps.waits);
  }

  private patchProzessArray(key: string, works: number[], waits: number[]): void {
    const worksArray = this.getWorksArray(key);
    const waitsArray = this.getWaitsArray(key);

    works.forEach((min, i) => {
      if (worksArray.at(i)) {
        worksArray.at(i).patchValue({ value: min, unit: 'Minuten' });
      }
    });
    waits.forEach((min, i) => {
      if (waitsArray.at(i)) {
        waitsArray.at(i).patchValue({ value: min, unit: 'Minuten' });
      }
    });
  }

  private formZuPayload(): SzenarioCreate {
    const toMinutesArr = (
      groups: { value: number; unit: ZeitEinheit }[],
    ) =>
      groups.map((g) =>
        Math.round((g.value ?? 0) * einheitZuFaktor(g.unit ?? 'Minuten')),
      );

    const val = this.form.value;
    return {
      name: this.nameInput.trim(),
      humanSteps: {
        works: toMinutesArr(val['menschlich'].works),
        waits: toMinutesArr(val['menschlich'].waits),
      },
      semiAutomatedSteps: {
        works: toMinutesArr(val['halbautomatisch'].works),
        waits: toMinutesArr(val['halbautomatisch'].waits),
      },
      automatedSteps: {
        works: toMinutesArr(val['vollautomatisch'].works),
        waits: toMinutesArr(val['vollautomatisch'].waits),
      },
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

  // Focused step per process (default: step index 0)
  focusedStep = signal<number[]>([0, 0, 0]);

  setFocusedStep(prozessIndex: number, stepIndex: number): void {
    this.focusedStep.update((arr) => {
      const copy = [...arr];
      copy[prozessIndex] = stepIndex;
      return copy;
    });
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

  /** Returns the detail text for the focused step of a process. */
  getFocusedStepDetail(prozessIndex: number): { label: string; arbeitszeit: string; wartezeit: string | null } {
    const snap = this.svgSnapshot().prozesse[prozessIndex];
    const stepIdx = this.focusedStep()[prozessIndex] ?? 0;
    const label = this.prozesse[prozessIndex]?.labels[stepIdx] ?? `Schritt ${stepIdx + 1}`;
    const work = snap.works[stepIdx] ?? 0;
    const wait = snap.waits[stepIdx] ?? null;
    return {
      label,
      arbeitszeit: minutenZuDauer(work),
      wartezeit: wait !== null ? minutenZuDauer(wait) : null,
    };
  }

  /** Builds the aria-label for a work rect. */
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

  /** Readonly export so template can call minutenZuDauer() */
  readonly formatDuration = minutenZuDauer;
}
