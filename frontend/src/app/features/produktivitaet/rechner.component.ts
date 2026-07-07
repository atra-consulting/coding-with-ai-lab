import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbNavChangeEvent, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime } from 'rxjs/operators';
import {
  DEFAULT_DURATIONS,
  PROZESS_ANNAHMEN,
  PROZESS_CAPTION,
  PROZESS_ROLLEN,
  PROZESSE,
  ProzessKey,
  Rolle,
} from '../../core/models/prozess-defaults';
import {
  PROZESS_SZENARIO_FELD,
  SzenarioProzessFeld,
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
import { computeComparisonBars, computePieSlices, computeSegments, PieResult, SvgSegment } from './svg-util';

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
      .seg-rect:focus-visible {
        outline: 3px solid #264892;
        outline-offset: 2px;
      }
      .seg-rect {
        cursor: pointer;
      }

      /* ── Gesamtdauer je Prozess: fett + hervorgehoben ── */
      .total-badge {
        font-weight: 700;
        font-size: 1.05rem;
        color: #264892;
        background: #eef3ff;
        border: 1px solid #d7e0f5;
        padding: 0.2rem 0.7rem;
        border-radius: 0.5rem;
        white-space: nowrap;
      }

      /* ── Karten-Überschriften kräftiger hervorheben ── */
      .card-title {
        font-size: 1.3rem;
        font-weight: 700;
        color: #1b2a52;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #d7e0f5;
        margin-bottom: 1rem;
      }

      /* ── Prozessvergleich title row: carries the full-width underline itself
         (instead of .card-title) because the filter button now shares the row —
         .card-title's own border-bottom would only underline the heading text. ── */
      .cmp-title-row {
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #d7e0f5;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .cmp-title-row .card-title {
        border-bottom: none;
        padding-bottom: 0;
        margin-bottom: 0;
      }

      /* ── Prozessvergleich filter button: keep its label on one line ── */
      .bar-filter-btn {
        white-space: nowrap;
      }

      /* ── Szenarien-Umschalter (unten, eingeklappt) ── */
      .szenarien-toggle {
        font-size: 1.3rem;
        font-weight: 700;
        color: #1b2a52;
      }
      .szenarien-toggle:hover {
        color: #264892;
      }

      /* ── Prozessvergleich: hybrid HTML row layout (name + small SVG bar + total + Annahmen), one row per process ── */
      .cmp-header-row {
        gap: 0.4rem 1.5rem;
        padding: 0 0.5rem;
        margin-bottom: 0.25rem;
      }
      .cmp-col-header {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #495057;
      }
      .cmp-rows {
        display: flex;
        flex-direction: column;
      }
      .cmp-row {
        position: relative;
      }
      .cmp-row + .cmp-row {
        border-top: 1px solid #eef0f3;
      }
      .cmp-row-content {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 0.4rem 1.5rem;
        padding: 0.6rem 0.5rem;
      }
      .cmp-row-main {
        flex: 1 1 260px;
        min-width: 220px;
      }
      .cmp-row-annahmen {
        flex: 1 1 220px;
        max-width: 340px;
      }
      .cmp-bar-svg {
        display: block;
        width: 100%;
        height: 16px;
      }
      .cmp-caption {
        font-style: normal;
        /* Sits above .cmp-hit (z-index: 1) so its text stays mouse-selectable;
           the row-selection overlay still covers name/bar/total around it. */
        position: relative;
        z-index: 2;
      }
      .cmp-annahmen-label-inline {
        display: block;
        margin-bottom: 0.15rem;
      }
      .cmp-annahmen-list {
        margin: 0;
        padding-left: 1.1rem;
        /* Stays under .cmp-hit (z-index: 1) so clicking the Annahmen bullets also
           selects the process, like the rest of the row. */
      }
      .cmp-annahmen-list li {
        font-weight: 600;
      }
      /* Transparent overlay covering the whole row: click/keyboard selects the process's tab.
         Kept as a sibling overlay (not a wrapper around the row content) so the real Annahmen/
         bar/total text underneath stays in the accessible tree for screen readers, instead of
         being swallowed by the button role's accessible-name computation. Mirrors the previous
         SVG design, where the transparent cmp-hit rect was also painted on top of — not around —
         the visible <text> nodes. */
      .cmp-hit {
        position: absolute;
        inset: 0;
        z-index: 1;
        border-radius: 0.5rem;
        cursor: pointer;
      }
      .cmp-hit:hover {
        background: rgba(38, 72, 146, 0.07);
      }
      .cmp-hit.active {
        background: rgba(38, 72, 146, 0.11);
      }
      .cmp-hit:focus-visible {
        outline: 3px solid #264892;
        outline-offset: -3px;
      }

      /* ── Prozess-Tabs (Schritt-Zeiten): kräftiger hervorgehoben ── */
      .schritt-tabs.nav-tabs {
        border-bottom: 2px solid #d7e0f5;
        gap: 0.3rem;
      }
      .schritt-tabs .nav-link {
        font-weight: 600;
        font-size: 1rem;
        color: #264892;
        padding: 0.6rem 1.1rem;
        border: 1px solid transparent;
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        margin-bottom: -2px;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .schritt-tabs .nav-link:hover {
        background: #eef3ff;
        border-color: #d7e0f5;
      }
      .schritt-tabs .nav-link.active {
        color: #fff;
        background: #264892;
        border-color: #264892;
        box-shadow: 0 2px 6px rgba(38, 72, 146, 0.25);
      }
      .schritt-tabs .nav-link:focus-visible {
        outline: 3px solid #264892;
        outline-offset: 2px;
      }

      /* ── Balken/Flussdiagramm toggle (5.6) ── */
      .view-toggle-btn {
        min-height: 44px;
        min-width: 44px;
        padding: 0.5rem 1rem;
      }

      /* ── Pie charts (5.3/5.4) ── */
      .pie-row {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        align-items: flex-start;
      }
      .pie-block {
        flex: 1 1 320px;
        max-width: 440px;
        min-width: 260px;
      }
      .pie-caption {
        font-weight: 600;
        font-size: 0.9rem;
        color: #264892;
        margin-bottom: 0.5rem;
      }
      /* Pie on the left, legend on the right. */
      .pie-body {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .pie-side {
        flex: 1 1 150px;
        min-width: 150px;
      }
      .pie-svg {
        display: block;
        flex: 0 0 auto;
        width: 140px;
        height: 140px;
        margin: 0;
      }
      /* White percent number inside a pie slice. */
      .pie-slice-label {
        fill: #fff;
        font-size: 8px;
        font-weight: 700;
        pointer-events: none;
      }
      .pie-note {
        font-size: 0.9rem;
        color: #495057;
        font-style: italic;
        margin-bottom: 0.5rem;
      }
      .pie-empty-label {
        text-align: center;
        color: #495057;
        font-size: 0.85rem;
        margin-bottom: 0.5rem;
      }
      .pie-legend {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 0;
      }
      .pie-legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.05rem;
        flex-wrap: wrap;
      }
      .pie-legend-swatch {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
        border-radius: 3px;
        border: 1px solid #495057;
      }
      .pie-legend-label {
        font-weight: 600;
        color: #212529;
      }
      .pie-legend-value {
        color: #495057;
      }

      /* ── Flowchart (5.5) ── */
      .flow-scroll {
        overflow-x: auto;
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        /* width:0 + min-width:100% keeps this scroll container from bubbling its
           wide, non-wrapping .flow-track content up through the block ancestors
           (tab-pane/tab-content/card-body/card) into the app shell's flex layout
           (.main-content is a flex item with flex-grow-1 and no min-width reset —
           without this, its automatic minimum size would inherit the flow-track's
           multi-thousand-pixel min-content width and blow out the whole page). */
        width: 0;
        min-width: 100%;
        box-sizing: border-box;
      }
      .flow-track {
        display: flex;
        flex-wrap: nowrap;
        align-items: stretch;
        width: max-content;
      }
      .flow-box {
        flex: 0 0 auto;
        width: 160px;
        min-height: 150px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 0.4rem;
        padding: 0.65rem 0.5rem;
        border: 1px solid #264892;
        border-radius: 0.5rem;
        background: #fff;
      }
      .flow-box:focus-visible {
        outline: 3px solid #264892;
        outline-offset: 2px;
      }
      .flow-box-nr {
        flex: 0 0 auto;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #e9edf7;
        color: #264892;
        font-weight: 700;
        font-size: 0.75rem;
      }
      .flow-box-label {
        font-size: 0.78rem;
        text-align: center;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        min-height: 2.9em;
      }
      .flow-chip {
        flex: 0 0 auto;
        font-size: 0.72rem;
        font-weight: 600;
        border-radius: 1rem;
        padding: 0.1rem 0.6rem;
      }
      .flow-chip-work {
        background: #264892;
        color: #fff;
      }
      .flow-chip-wait {
        background: #cf944f;
        color: #212529;
      }
      .flow-connector {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        align-self: center;
        padding: 0 0.4rem;
        color: #495057;
        font-size: 1.1rem;
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
  private document = inject(DOCUMENT);

  /**
   * Skip-link handler: focus the tab's Schritt-Zeiten form directly.
   * A raw `href="#form-…"` would resolve against `<base href="/">` → `/#form-…`,
   * triggering a full-page redirect to /dashboard. Focus programmatically instead.
   */
  focusForm(event: Event, targetId: string): void {
    event.preventDefault();
    (this.document.getElementById(targetId) as HTMLElement | null)?.focus();
  }

  /**
   * Selects a process from the Prozessvergleich chart: activates that
   * process's tab (no scrolling — keep the user where they are).
   */
  selectProzess(index: number): void {
    this.activeTab = index + 1;
    this.revealProcess(index);
    this.setViewMode('balken');
  }

  /**
   * Makes sure the given process's comparison bar is visible under the current
   * bar filter. Reveal-only: raises barLimit if the process is hidden, never
   * hides bars already shown. Selecting the last process shows all bars again
   * (barLimit = 0). Keeps the "Prozesse" button label (barLimitLabel) in sync.
   */
  revealProcess(index: number): void {
    const n = this.barLimit();
    if (n !== 0 && index >= n) {
      const next = index + 1;
      this.barLimit.set(next >= PROZESSE.length ? 0 : next);
    }
  }

  readonly prozesse = PROZESSE;
  readonly zeiteinheiten: ZeitEinheit[] = ZEITEINHEITEN;

  /**
   * Prozessvergleich card: cycles how many of the four comparison bars are shown.
   * 0 = alle Balken, 1 = nur Balken 1, 2 = Balken 1–2, 3 = Balken 1–3. The bar
   * SCALE stays fixed (getComparisonBars() is untouched) — this only hides rows,
   * it never resizes the remaining bars. Affects the Prozessvergleich card only,
   * not the Schritt-Zeiten tabs.
   */
  barLimit = signal(0);

  cycleBarLimit(): void {
    this.barLimit.set((this.barLimit() + 1) % 4);
  }

  isBarVisible(index: number): boolean {
    const n = this.barLimit();
    return n === 0 || index < n;
  }

  readonly barLimitLabel = computed(() => {
    switch (this.barLimit()) {
      case 1: return 'Nur Prozess 1';
      case 2: return 'Prozesse 1–2';
      case 3: return 'Prozesse 1–3';
      default: return 'Alle Prozesse';
    }
  });

  /** Prozessvergleich card: two "Annahmen" bullets per process + the Agile-mit-KI-only caption. */
  readonly prozessAnnahmen = PROZESS_ANNAHMEN;
  readonly prozessCaption = PROZESS_CAPTION;

  activeTab = 1;

  /** Szenarien card is collapsed by default (kept out of the way at the page bottom). */
  showSzenarien = false;
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

  /**
   * Tracks each step's unit control's most-recently-seen value, so wireUnitConversion
   * can detect a real user-driven unit change vs. a silent {emitEvent:false} reset
   * (e.g. from patchSchritt during a scenario load). Keyed by the control instance
   * because RxJS emission history (pairwise) can't see emitEvent:false patches.
   */
  private letzteEinheit = new Map<FormControl<ZeitEinheit>, ZeitEinheit>();

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

  /**
   * On tab switch: reset the Balken/Flussdiagramm toggle and reveal the
   * selected process's bar in the Prozessvergleich card (tab ids are 1-based).
   */
  onNavChange(event: NgbNavChangeEvent): void {
    this.viewModeSignal.set('balken');
    this.revealProcess(Number(event.nextId) - 1);
  }

  /** Setter for ui-designer's upcoming toggle. */
  setViewMode(mode: 'balken' | 'flussdiagramm'): void {
    this.viewModeSignal.set(mode);
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
   * in place (R5). The "previous unit" is tracked explicitly in the letzteEinheit map
   * (keyed by control instance) rather than derived from RxJS emission history —
   * patchSchritt's silent {emitEvent:false} reset during a scenario load never fires
   * valueChanges, so a pairwise buffer would go stale and mislabel the loaded value.
   */
  private wireUnitConversion(group: FormGroup): void {
    const unitCtrl = group.get('unit') as FormControl<ZeitEinheit>;
    const valueCtrl = group.get('value') as FormControl<number>;

    this.letzteEinheit.set(unitCtrl, unitCtrl.value);

    unitCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cur) => {
        const prev = this.letzteEinheit.get(unitCtrl) ?? unitCtrl.value;
        this.letzteEinheit.set(unitCtrl, cur);
        if (prev === cur) return;

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

    for (const p of PROZESSE) {
      const feld = PROZESS_SZENARIO_FELD[p.key];
      const stored: ProzessDauer | undefined = s[feld];
      const quelle =
        stored && stored.works.length === p.stepCount ? stored : DEFAULT_DURATIONS[p.key];
      this.patchProzessArray(p.key, quelle.works, quelle.waits);
    }

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

      // The patch above never fires unitCtrl.valueChanges (emitEvent:false), so keep
      // the tracked "previous unit" truthful for the next real user-driven switch.
      const unitCtrl = this.getUnitCtrl(ctrl);
      this.letzteEinheit.set(unitCtrl, 'Minuten');
    };

    works.forEach((min, i) => patchSchritt(worksArray.at(i), min));
    waits.forEach((min, i) => patchSchritt(waitsArray.at(i), min));
  }

  private formZuPayload(): SzenarioCreate {
    const toMinutesArr = (groups: { value: number; unit: ZeitEinheit }[]) =>
      groups.map((g) => Math.round((g.value ?? 0) * einheitZuFaktor(g.unit ?? 'Minuten')));

    const val = this.form.value;
    const steps = {} as Record<SzenarioProzessFeld, ProzessDauer>;
    for (const p of PROZESSE) {
      steps[PROZESS_SZENARIO_FELD[p.key]] = {
        works: toMinutesArr(val[p.key].works),
        waits: toMinutesArr(val[p.key].waits),
      };
    }

    return { name: this.nameInput.trim(), ...steps };
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

  /** Tooltip text for a wait segment (includes the title of the step it follows). */
  getWaitTooltip(prozessIndex: number, stepIndex: number): string {
    const snap = this.svgSnapshot().prozesse[prozessIndex];
    const waitMin = snap.waits[stepIndex] ?? 0;
    const label = this.prozesse[prozessIndex]?.labels[stepIndex] ?? `Schritt ${stepIndex + 1}`;
    return `Wartezeit nach Schritt ${stepIndex + 1} (${label}): ${minutenZuDauer(waitMin)}`;
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

  // ── Pie chart wrappers (5.2–5.4) — thin adapters over the pure svg-util helper,
  // mirroring the existing getSegments()/getComparisonBars() pattern. Templates
  // cannot call bare imported functions or do arc trigonometry themselves, so the
  // geometry (computePieSlices) is wrapped here and consumed read-only by the template. ──

  /** Pie A input (all 4 tabs): Arbeit vs. Warten, 2 slices. */
  getPieASlices(index: number): PieResult {
    const { work, wait } = this.getWorkWaitTotals(index);
    const arbeitsLabel = this.getArbeitszeitLabel(index);
    return computePieSlices(
      [
        { key: 'work', value: work, color: '#264892', label: arbeitsLabel },
        { key: 'wait', value: wait, color: '#cf944f', label: 'Wartezeit' },
      ],
      50,
      50,
      45,
    );
  }

  /**
   * Pie B input (menschlich + agileKi tabs only): role split of the work total, 3 slices.
   * Returns an isEmpty result (no slices) for the two KI-only tabs so the template never
   * has to deal with a nullable result — it simply never renders Pie B for those tabs.
   */
  getPieBSlices(index: number): PieResult {
    const split = this.getRollenSplit(index);
    if (!split) {
      return { slices: [], isEmpty: true, isFullCircle: false };
    }
    return computePieSlices(
      [
        { key: 'ba', value: split.ba, color: '#6f42c1', label: 'BA' },
        { key: 'dev', value: split.dev, color: '#0f766e', label: 'Dev' },
        { key: 'tester', value: split.tester, color: '#9a6700', label: 'Tester' },
      ],
      50,
      50,
      45,
    );
  }
}
