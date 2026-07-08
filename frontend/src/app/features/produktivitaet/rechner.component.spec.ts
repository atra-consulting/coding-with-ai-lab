import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { NgbModal, NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { RechnerComponent } from './rechner.component';
import { SzenarioService } from '../../core/services/szenario.service';
import { NotificationService } from '../../core/services/notification.service';
import { Szenario, SzenarioCreate } from '../../core/models/szenario.model';
import {
  DEFAULT_DURATIONS,
  PROZESS_ANNAHMEN,
  PROZESS_CAPTION,
  PROZESS_STEP_LABELS,
  PROZESSE,
  ProzessKey,
} from '../../core/models/prozess-defaults';

// ─── Test-data factories ───────────────────────────────────────────────────

function makeMockNotification(): jasmine.SpyObj<NotificationService> {
  return jasmine.createSpyObj<NotificationService>('NotificationService', [
    'success',
    'error',
    'info',
    'warning',
  ]);
}

// A minimal NgbModal stub — nothing under test opens the confirm dialog.
function makeModalStub(): Partial<NgbModal> {
  return {
    open: jasmine.createSpy('open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(undefined),
    }),
  } as Partial<NgbModal>;
}

function makeMockSzenarioService(list: Szenario[] = []): jasmine.SpyObj<SzenarioService> {
  const spy = jasmine.createSpyObj<SzenarioService>('SzenarioService', [
    'list',
    'getById',
    'create',
    'update',
    'delete',
  ]);
  spy.list.and.returnValue(of(list));
  return spy;
}

/** Builds a ProzessDauer with distinct, easily-asserted fill values (never matching DEFAULT_DURATIONS). */
function makeProzessDauer(workLen: number, waitLen: number, workVal: number, waitVal: number) {
  return {
    works: new Array(workLen).fill(workVal) as number[],
    waits: new Array(waitLen).fill(waitVal) as number[],
  };
}

/**
 * A fully valid Szenario (correct array lengths for all 4 processes) with distinct,
 * non-default, per-process fill values — this is what makes the ladeScenario() specs
 * below able to catch a PROZESS_SZENARIO_FELD column-swap (e.g. agileKi accidentally
 * reading humanSteps): every process has its own unique work/wait fill value, so a
 * swapped field produces the wrong number, not a coincidentally-correct one.
 *   humanSteps:         19 works * 100, 18 waits * 50  → total 2,800
 *   agileKiSteps:       19 works * 10,  18 waits * 50  → total 1,090
 *   semiAutomatedSteps: 11 works * 20,  10 waits * 15  → total   370
 *   automatedSteps:      2 works * 30,   1 wait  * 5   → total    65
 */
function makeFullSzenario(overrides: Partial<Szenario> = {}): Szenario {
  return {
    id: 1,
    name: 'Test-Szenario',
    humanSteps: makeProzessDauer(19, 18, 100, 50),
    agileKiSteps: makeProzessDauer(19, 18, 10, 50),
    semiAutomatedSteps: makeProzessDauer(11, 10, 20, 15),
    automatedSteps: makeProzessDauer(2, 1, 30, 5),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Reaches into the form to grab a step group's value/unit controls (works array, by process key + index). */
function stepControls(component: RechnerComponent, key: ProzessKey, index: number) {
  const ctrl = component.getWorksArray(key).at(index) as FormGroup;
  return { value: component.getValueCtrl(ctrl), unit: component.getUnitCtrl(ctrl) };
}

// ─── Shared TestBed setup ───────────────────────────────────────────────────
//
// One outer `describe` with a single beforeEach/afterEach, matching the sibling
// list-component specs (e.g. firma-list.component.spec.ts): HttpClientTesting is
// wired even though SzenarioService itself is fully mocked, so any stray real HTTP
// call from elsewhere in the component tree is still caught by httpMock.verify().

describe('RechnerComponent', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;
  let mockSzenarioService: jasmine.SpyObj<SzenarioService>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    // The component now hydrates barLimit from sessionStorage on construction
    // and persists it via a field effect() on every change — start from a
    // known-clean slate BEFORE the component is created, so hydration always
    // starts from empty. Mirrors ticket-board.component.spec.ts's recentOnly
    // sessionStorage-isolation pattern (Karma runs specs in random order).
    sessionStorage.removeItem('rechner.barLimit');

    mockSzenarioService = makeMockSzenarioService();

    await TestBed.configureTestingModule({
      imports: [RechnerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SzenarioService, useValue: mockSzenarioService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    // Several tests below mutate barLimit (which persists to sessionStorage via
    // its field effect) — clear it so it can't leak into a sibling spec.
    sessionStorage.removeItem('rechner.barLimit');
  });

  // ─── Component creation ───────────────────────────────────────────────────

  describe('creation', () => {
    it('creates without errors', () => {
      expect(component).toBeTruthy();
    });

    it('calls SzenarioService.list() on init', () => {
      expect(mockSzenarioService.list).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Unit conversion (R5) — the component's unit-change handler ──────────

  describe('unit conversion handler (R5)', () => {
    it('converts 240 Minuten to 4 Stunden when the unit switches to Stunden', () => {
      const { value, unit } = stepControls(component, 'menschlich', 1);
      value.setValue(240);

      unit.setValue('Stunden');

      expect(value.value).toBe(4);
    });

    it('converts 4 Stunden to 0.5 Tage when the unit switches to Tage', () => {
      const { value, unit } = stepControls(component, 'menschlich', 1);
      value.setValue(240);
      unit.setValue('Stunden');

      unit.setValue('Tage');

      expect(value.value).toBe(0.5);
    });

    it('converts 0.5 Tage back to 240 Minuten (round-trip)', () => {
      const { value, unit } = stepControls(component, 'menschlich', 1);
      value.setValue(240);
      unit.setValue('Stunden');
      unit.setValue('Tage');

      unit.setValue('Minuten');

      expect(value.value).toBe(240);
    });

    it('rounds a non-terminating conversion to at most 2 decimals (100 Minuten → Stunden)', () => {
      const { value, unit } = stepControls(component, 'menschlich', 2);
      value.setValue(100);

      unit.setValue('Stunden');

      expect(value.value).toBeCloseTo(1.67, 2);
      // Assert the value truly has at most 2 decimal places.
      expect(Math.round(value.value * 100) / 100).toBe(value.value);
    });

    it('resets the value max validator to the new unit scale after a conversion', () => {
      const { value, unit } = stepControls(component, 'menschlich', 3);

      unit.setValue('Tage');
      value.setValue(1000);
      expect(value.invalid).toBeTrue();

      value.setValue(999);
      expect(value.valid).toBeTrue();
    });

    it('applies the wait-step unit handler the same way as the work-step handler', () => {
      const waitsArray = component.getWaitsArray('menschlich');
      const ctrl = waitsArray.at(0) as FormGroup;
      const valueCtrl = component.getValueCtrl(ctrl);
      const unitCtrl = component.getUnitCtrl(ctrl);
      valueCtrl.setValue(240);

      unitCtrl.setValue('Stunden');

      expect(valueCtrl.value).toBe(4);
    });
  });

  // ─── Scenario load: no conversion pipeline ────────────────────────────────

  describe('ladeScenario() does not run the unit-conversion pipeline', () => {
    it('a step left on "Stunden" before load ends up with the raw loaded minute value, not a converted one', () => {
      const { value, unit } = stepControls(component, 'halbautomatisch', 1);
      unit.setValue('Stunden');
      value.setValue(10); // stands in for "10 Stunden", set before the load

      const szenario = makeFullSzenario({
        semiAutomatedSteps: {
          works: [0, 777, 10, 10, 5, 10, 10, 5, 10, 30, 20],
          waits: [5, 60, 5, 60, 60, 5, 60, 5, 60, 5],
        },
      });
      component.ladeScenario(szenario);

      // If the conversion pipeline had (incorrectly) fired on load, it would have
      // recomputed a value derived from the stale pre-load state — not the exact
      // stored minute value of 777.
      expect(unit.value).toBe('Minuten');
      expect(value.value).toBe(777);
    });
  });

  describe('ladeScenario() resets a Tage-scale validator back to Minuten', () => {
    it('a field switched to Tage before load accepts a large loaded minute value after load', () => {
      const { value, unit } = stepControls(component, 'vollautomatisch', 1);
      unit.setValue('Tage'); // max becomes 999

      const szenario = makeFullSzenario({
        automatedSteps: { works: [0, 5000], waits: [5] },
      });
      component.ladeScenario(szenario);

      expect(unit.value).toBe('Minuten');
      expect(value.value).toBe(5000);
      expect(value.valid).toBeTrue();
    });
  });

  // ─── Scenario load: positive refresh, all 4 processes (column-swap guard) ─

  describe('ladeScenario() refresh (guards the post-load recompute)', () => {
    it('getProzessTotal() reflects the loaded menschlich total after ladeScenario() (index 0)', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      // menschlich: 19 works * 100 + 18 waits * 50 = 1900 + 900 = 2800
      expect(component.getProzessTotal(0)).toBe(2800);
    });

    it('svgSnapshot() works/waits reflect the loaded menschlich arrays after ladeScenario() (index 0)', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      const snap = component.svgSnapshot().prozesse[0];
      expect(snap.works).toEqual(new Array(19).fill(100));
      expect(snap.waits).toEqual(new Array(18).fill(50));
    });

    it('getProzessTotal() reflects the loaded agileKi total after ladeScenario() (index 1, column-swap guard)', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      // agileKi: 19 works * 10 + 18 waits * 50 = 190 + 900 = 1090
      expect(component.getProzessTotal(1)).toBe(1090);
    });

    it('svgSnapshot() works/waits reflect the loaded agileKi arrays after ladeScenario() (index 1, column-swap guard)', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      const snap = component.svgSnapshot().prozesse[1];
      expect(snap.works).toEqual(new Array(19).fill(10));
      expect(snap.waits).toEqual(new Array(18).fill(50));
    });

    it('getProzessTotal() reflects the loaded halbautomatisch total after ladeScenario() (index 2, column-swap guard)', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      // halbautomatisch: 11 works * 20 + 10 waits * 15 = 220 + 150 = 370
      expect(component.getProzessTotal(2)).toBe(370);
    });

    it('svgSnapshot() works/waits reflect the loaded halbautomatisch arrays after ladeScenario() (index 2, column-swap guard)', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      const snap = component.svgSnapshot().prozesse[2];
      expect(snap.works).toEqual(new Array(11).fill(20));
      expect(snap.waits).toEqual(new Array(10).fill(15));
    });

    it('getProzessTotal() reflects the loaded vollautomatisch total after ladeScenario() (index 3)', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      // vollautomatisch: 2 works * 30 + 1 wait * 5 = 60 + 5 = 65
      expect(component.getProzessTotal(3)).toBe(65);
    });

    it('svgSnapshot() works/waits reflect the loaded vollautomatisch arrays after ladeScenario() (index 3)', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      const snap = component.svgSnapshot().prozesse[3];
      expect(snap.works).toEqual(new Array(2).fill(30));
      expect(snap.waits).toEqual(new Array(1).fill(5));
    });

    it('the form value reflects the loaded works array after ladeScenario()', () => {
      const szenario = makeFullSzenario();
      component.ladeScenario(szenario);

      const worksArray = component.getWorksArray('menschlich');
      expect(component.getValueCtrl(worksArray.at(0) as FormGroup).value).toBe(100);
    });
  });

  // ─── Scenario-load fallback for mismatched/missing process data ──────────

  describe('ladeScenario() falls back to defaults on mismatched process data', () => {
    it('does not throw when a process array has the wrong length', () => {
      const szenario = makeFullSzenario({
        // halbautomatisch expects 11 works — this one has only 5 (wrong length)
        semiAutomatedSteps: { works: [0, 5, 15, 15, 10], waits: [5, 60, 60, 5] },
      });

      expect(() => component.ladeScenario(szenario)).not.toThrow();
    });

    it('falls back to DEFAULT_DURATIONS for the process whose works array has the wrong length', () => {
      const szenario = makeFullSzenario({
        semiAutomatedSteps: { works: [0, 5, 15, 15, 10], waits: [5, 60, 60, 5] },
      });

      component.ladeScenario(szenario);

      const worksArray = component.getWorksArray('halbautomatisch');
      const values = worksArray.controls.map((c) => component.getValueCtrl(c as FormGroup).value);
      expect(values).toEqual(DEFAULT_DURATIONS.halbautomatisch.works);
    });

    it('still patches correctly-shaped processes from the stored (non-default) data', () => {
      const szenario = makeFullSzenario({
        semiAutomatedSteps: { works: [0, 5, 15, 15, 10], waits: [5, 60, 60, 5] }, // wrong length
      });

      component.ladeScenario(szenario);

      // menschlich (19/18, correct length) must be patched from the stored data, not fall back.
      const worksArray = component.getWorksArray('menschlich');
      const firstValue = component.getValueCtrl(worksArray.at(0) as FormGroup).value;
      expect(firstValue).toBe(100); // fill value used by makeFullSzenario's humanSteps
    });

    it('falls back to DEFAULT_DURATIONS when a process field is missing from the payload entirely', () => {
      const full = makeFullSzenario();
      const { automatedSteps: _omitted, ...rest } = full;
      const szenario = rest as unknown as Szenario;

      expect(() => component.ladeScenario(szenario)).not.toThrow();

      const worksArray = component.getWorksArray('vollautomatisch');
      const values = worksArray.controls.map((c) => component.getValueCtrl(c as FormGroup).value);
      expect(values).toEqual(DEFAULT_DURATIONS.vollautomatisch.works);
    });
  });

  // ─── Role split (getRollenSplit) ──────────────────────────────────────────

  describe('getRollenSplit()', () => {
    it('returns {ba:180, dev:640, tester:180} for menschlich (index 0)', () => {
      expect(component.getRollenSplit(0)).toEqual({ ba: 180, dev: 640, tester: 180 });
    });

    it('returns {ba:20, dev:60, tester:10} for agileKi (index 1)', () => {
      expect(component.getRollenSplit(1)).toEqual({ ba: 20, dev: 60, tester: 10 });
    });

    it('returns null for halbautomatisch (index 2, no role assignment)', () => {
      expect(component.getRollenSplit(2)).toBeNull();
    });

    it('returns null for vollautomatisch (index 3, no role assignment)', () => {
      expect(component.getRollenSplit(3)).toBeNull();
    });
  });

  // ─── Pie B input (getPieBSlices) ──────────────────────────────────────────

  describe('getPieBSlices()', () => {
    it('returns an empty result for halbautomatisch (index 2, no Pie B on KI-only tabs)', () => {
      const result = component.getPieBSlices(2);
      expect(result.isEmpty).toBeTrue();
      expect(result.slices).toEqual([]);
    });

    it('returns an empty result for vollautomatisch (index 3, no Pie B on KI-only tabs)', () => {
      const result = component.getPieBSlices(3);
      expect(result.isEmpty).toBeTrue();
      expect(result.slices).toEqual([]);
    });

    it('returns 3 slices for menschlich (index 0) consistent with getRollenSplit', () => {
      const result = component.getPieBSlices(0);
      const split = component.getRollenSplit(0);

      expect(result.isEmpty).toBeFalse();
      expect(result.slices.length).toBe(3);
      expect(result.slices.find((s) => s.key === 'ba')?.value).toBe(split!.ba);
      expect(result.slices.find((s) => s.key === 'dev')?.value).toBe(split!.dev);
      expect(result.slices.find((s) => s.key === 'tester')?.value).toBe(split!.tester);
    });

    it('returns 3 slices for agileKi (index 1) consistent with getRollenSplit', () => {
      const result = component.getPieBSlices(1);
      const split = component.getRollenSplit(1);

      expect(result.isEmpty).toBeFalse();
      expect(result.slices.length).toBe(3);
      expect(result.slices.find((s) => s.key === 'ba')?.value).toBe(split!.ba);
      expect(result.slices.find((s) => s.key === 'dev')?.value).toBe(split!.dev);
      expect(result.slices.find((s) => s.key === 'tester')?.value).toBe(split!.tester);
    });
  });

  // ─── Flowchart data (getFlowchartSchritte) ────────────────────────────────

  describe('getFlowchartSchritte()', () => {
    it('returns 19 steps for menschlich (index 0), numbered 1..19', () => {
      const schritte = component.getFlowchartSchritte(0);
      expect(schritte.length).toBe(19);
      expect(schritte.map((s) => s.nr)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
    });

    it('maps label and work minutes correctly for the first step of menschlich', () => {
      const schritte = component.getFlowchartSchritte(0);
      expect(schritte[0].label).toBe(PROZESSE[0].labels[0]);
      expect(schritte[0].work).toBe(DEFAULT_DURATIONS.menschlich.works[0]);
      expect(schritte[0].wait).toBe(DEFAULT_DURATIONS.menschlich.waits[0]);
    });

    it('the last step of menschlich has wait === null', () => {
      const schritte = component.getFlowchartSchritte(0);
      expect(schritte[schritte.length - 1].wait).toBeNull();
    });

    it('returns 2 steps for vollautomatisch (index 3), last step wait === null', () => {
      const schritte = component.getFlowchartSchritte(3);
      expect(schritte.length).toBe(2);
      expect(schritte[0].work).toBe(DEFAULT_DURATIONS.vollautomatisch.works[0]);
      expect(schritte[0].wait).toBe(DEFAULT_DURATIONS.vollautomatisch.waits[0]);
      expect(schritte[1].wait).toBeNull();
    });
  });

  // ─── Save path (neuSpeichern / formZuPayload) ─────────────────────────────

  describe('neuSpeichern()', () => {
    it('calls SzenarioService.create() with a payload carrying all 4 process fields, including agileKiSteps', () => {
      mockSzenarioService.create.and.returnValue(of(makeFullSzenario({ id: 42, name: 'Mein Szenario' })));
      component.nameInput = 'Mein Szenario';

      component.neuSpeichern();

      expect(mockSzenarioService.create).toHaveBeenCalledTimes(1);
      const payload = mockSzenarioService.create.calls.mostRecent().args[0] as SzenarioCreate;

      expect(payload.name).toBe('Mein Szenario');
      expect(payload.humanSteps.works.length).toBe(19);
      expect(payload.humanSteps.waits.length).toBe(18);
      expect(payload.agileKiSteps.works.length).toBe(19);
      expect(payload.agileKiSteps.waits.length).toBe(18);
      expect(payload.semiAutomatedSteps.works.length).toBe(11);
      expect(payload.semiAutomatedSteps.waits.length).toBe(10);
      expect(payload.automatedSteps.works.length).toBe(2);
      expect(payload.automatedSteps.waits.length).toBe(1);
      // The unmodified form still carries the DEFAULT_DURATIONS values, so the
      // payload's agileKiSteps must be distinct from its humanSteps (column-swap guard).
      expect(payload.agileKiSteps.works).toEqual(DEFAULT_DURATIONS.agileKi.works);
      expect(payload.agileKiSteps.works).not.toEqual(payload.humanSteps.works);
    });

    it('sets nameError when create() fails with a fieldErrors.name validation error', () => {
      mockSzenarioService.create.and.returnValue(
        throwError(() => ({ error: { fieldErrors: { name: 'Name bereits vergeben.' } } })),
      );
      component.nameInput = 'Duplikat';

      component.neuSpeichern();

      expect(component.nameError).toBe('Name bereits vergeben.');
    });
  });

  // ─── DOM: tab strip, no old titles, flowchart aria-labels (R2/R4) ─────────

  describe('DOM: single 4-tab strip, no old process names (R2)', () => {
    it('renders exactly one tab strip', () => {
      const strips = fixture.nativeElement.querySelectorAll('ul.nav-tabs');
      expect(strips.length).toBe(1);
    });

    it('renders exactly 4 tabs', () => {
      const tabs = fixture.nativeElement.querySelectorAll('ul.nav-tabs > li');
      expect(tabs.length).toBe(4);
    });

    it('does not render the old process names "Menschlich", "Halbautomatisch", or "Vollautomatisch"', () => {
      const text: string = fixture.nativeElement.textContent;
      expect(text).not.toContain('Menschlich');
      expect(text).not.toContain('Halbautomatisch');
      expect(text).not.toContain('Vollautomatisch');
    });
  });

  describe('DOM: flowchart box aria-labels (R4)', () => {
    it('every flowchart box on the default tab has a non-empty aria-label and the exact step count', () => {
      component.setViewMode('flussdiagramm');
      fixture.detectChanges();

      // Single pane at first render — no ngbNav tab switch has happened yet, so no
      // stale pane can be retained; the box count is exactly the active tab's stepCount.
      const boxes: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.flow-box');
      expect(boxes.length).toBe(PROZESSE[0].stepCount);
      boxes.forEach((box) => {
        expect((box.getAttribute('aria-label') ?? '').trim().length).toBeGreaterThan(0);
      });
    });

    it('every flowchart box has a non-empty aria-label and the exact step count, on each of the four tabs', () => {
      for (let i = 0; i < PROZESSE.length; i++) {
        // A fresh component instance per tab, with activeTab set BEFORE the first
        // detectChanges(), sidesteps ngbNav's pane retention on (click-driven) tab
        // switches — under synchronous TestBed change detection a just-hidden pane's
        // .flow-box elements can still be in the DOM at query time, inflating the
        // count (verified as a test-harness timing artifact, not a real rendering bug:
        // the live app's flow-track scrollWidth matches exactly one tab's box count).
        // Isolating one tab per fixture means only that tab's pane has ever existed.
        const freshFixture = TestBed.createComponent(RechnerComponent);
        freshFixture.componentInstance.activeTab = i + 1;
        freshFixture.detectChanges();
        freshFixture.componentInstance.setViewMode('flussdiagramm');
        freshFixture.detectChanges();

        const boxes: NodeListOf<HTMLElement> = freshFixture.nativeElement.querySelectorAll('.flow-box');
        expect(boxes.length).toBe(PROZESSE[i].stepCount);
        boxes.forEach((box) => {
          expect((box.getAttribute('aria-label') ?? '').trim().length).toBeGreaterThan(0);
        });
      }
    });
  });

  // ─── DOM: Prozessvergleich Annahmen bullets + per-process caption ─────────

  describe('DOM: Prozessvergleich Annahmen bullets and caption', () => {
    it('renders exactly 2 Annahmen bullets per process, matching PROZESS_ANNAHMEN in R1 order', () => {
      const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cmp-row');
      expect(rows.length).toBe(4);

      rows.forEach((row, i) => {
        const key = PROZESSE[i].key;
        const bullets = Array.from(row.querySelectorAll('.cmp-annahmen-list li')).map(
          (li) => li.textContent?.trim(),
        );
        expect(bullets).toEqual(PROZESS_ANNAHMEN[key]);
      });
    });

    it('renders one caption per process, matching PROZESS_CAPTION', () => {
      const captions: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cmp-caption');
      expect(captions.length).toBe(4);

      const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cmp-row');
      rows.forEach((row, i) => {
        const key = PROZESSE[i].key;
        const caption = row.querySelector('.cmp-caption');
        expect(caption).not.toBeNull();
        expect(caption?.textContent?.trim()).toBe(PROZESS_CAPTION[key]);
      });
    });
  });

  // ─── Prozessvergleich bar filter (barLimit / cycleBarLimit / isBarVisible) ─

  describe('Prozessvergleich bar filter', () => {
    it('defaults barLimit() to 0, with all four bars visible', () => {
      expect(component.barLimit()).toBe(0);
      expect(component.isBarVisible(0)).toBeTrue();
      expect(component.isBarVisible(1)).toBeTrue();
      expect(component.isBarVisible(2)).toBeTrue();
      expect(component.isBarVisible(3)).toBeTrue();
    });

    it('cycleBarLimit() steps 0 → 1 → 2 → 3 → 0', () => {
      expect(component.barLimit()).toBe(0);

      component.cycleBarLimit();
      expect(component.barLimit()).toBe(1);

      component.cycleBarLimit();
      expect(component.barLimit()).toBe(2);

      component.cycleBarLimit();
      expect(component.barLimit()).toBe(3);

      component.cycleBarLimit();
      expect(component.barLimit()).toBe(0);
    });

    it('at barLimit 2, only bars 0 and 1 are visible', () => {
      component.barLimit.set(2);

      expect(component.isBarVisible(0)).toBeTrue();
      expect(component.isBarVisible(1)).toBeTrue();
      expect(component.isBarVisible(2)).toBeFalse();
      expect(component.isBarVisible(3)).toBeFalse();
    });

    it('barLimitLabel() returns the right label for each of the four states', () => {
      component.barLimit.set(0);
      expect(component.barLimitLabel()).toBe('Alle Prozesse');

      component.barLimit.set(1);
      expect(component.barLimitLabel()).toBe('Nur Prozess 1');

      component.barLimit.set(2);
      expect(component.barLimitLabel()).toBe('Prozesse 1–2');

      component.barLimit.set(3);
      expect(component.barLimitLabel()).toBe('Prozesse 1–3');
    });

    it('renders exactly one .cmp-row when barLimit is set to 1', () => {
      component.barLimit.set(1);
      fixture.detectChanges();

      const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cmp-row');
      expect(rows.length).toBe(1);
    });

    it('clicking the filter button cycles to "Nur Prozess 1" and shows exactly one .cmp-row', () => {
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('#prozessvergleich button');
      expect(button).toBeTruthy();
      expect(button.textContent?.trim()).toBe('Alle Prozesse');

      button.click();
      fixture.detectChanges();

      expect(button.textContent?.trim()).toBe('Nur Prozess 1');
      const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cmp-row');
      expect(rows.length).toBe(1);
    });

    it('revealProcess() raises barLimit so a hidden process bar becomes visible', () => {
      component.barLimit.set(2); // shows processes 0 and 1
      component.revealProcess(2); // select process index 2 (hidden)
      expect(component.barLimit()).toBe(3);
      expect(component.barLimitLabel()).toBe('Prozesse 1–3');
      expect(component.isBarVisible(2)).toBeTrue();
    });

    it('revealProcess() shows all bars (barLimit 0) when the last process is selected', () => {
      component.barLimit.set(2);
      component.revealProcess(3); // last process
      expect(component.barLimit()).toBe(0);
      expect(component.barLimitLabel()).toBe('Alle Prozesse');
    });

    it('revealProcess() never hides bars already visible', () => {
      component.barLimit.set(2);
      component.revealProcess(0); // already visible
      expect(component.barLimit()).toBe(2);
    });

    it('revealProcess() does nothing when all bars are shown (barLimit 0)', () => {
      component.barLimit.set(0);
      component.revealProcess(2);
      expect(component.barLimit()).toBe(0);
    });

    it('onNavChange() reveals the newly selected process bar', () => {
      component.barLimit.set(1); // only process 0 visible
      component.onNavChange({ activeId: 1, nextId: 3, preventDefault: () => {} } as NgbNavChangeEvent);
      expect(component.barLimit()).toBe(3); // process index 2 revealed
      expect(component.isBarVisible(2)).toBeTrue();
    });
  });

  // ─── barLimit sessionStorage persistence (RECHNER-PROZESS-VERBESSERUNGEN) ──
  //
  // barLimit is now hydrated from sessionStorage on construction (readBarLimit())
  // and persisted via a field effect() (persistBarLimit) on every change — mirrors
  // ticket-board.component.ts's recentOnly pattern, so the "Alle Prozesse" filter
  // survives navigation between screens within the same browser session.

  describe('barLimit sessionStorage persistence', () => {
    const STORAGE_KEY = 'rechner.barLimit';

    it('cycleBarLimit() writes the new value to sessionStorage', () => {
      component.cycleBarLimit();
      fixture.detectChanges(); // flushes the field effect() that persists barLimit

      expect(sessionStorage.getItem(STORAGE_KEY)).toBe('1');
    });

    it('a component constructed while sessionStorage holds "2" starts with barLimit() === 2 (remembered across screens)', () => {
      sessionStorage.setItem(STORAGE_KEY, '2');

      const freshComponent = TestBed.createComponent(RechnerComponent).componentInstance;

      expect(freshComponent.barLimit()).toBe(2);
    });

    it('a junk stored value ("x") yields barLimit() === 0 on construction', () => {
      sessionStorage.setItem(STORAGE_KEY, 'x');

      const freshComponent = TestBed.createComponent(RechnerComponent).componentInstance;

      expect(freshComponent.barLimit()).toBe(0);
    });

    it('an out-of-range stored value ("9") yields barLimit() === 0 on construction', () => {
      sessionStorage.setItem(STORAGE_KEY, '9');

      const freshComponent = TestBed.createComponent(RechnerComponent).componentInstance;

      expect(freshComponent.barLimit()).toBe(0);
    });

    it('does not throw and defaults barLimit() to 0 when sessionStorage.getItem() throws', () => {
      // barLimit is hydrated via a field initializer (readBarLimit()), so the spy
      // must be in place BEFORE the component is constructed.
      spyOn(sessionStorage, 'getItem').and.throwError('Storage disabled');

      let freshComponent!: RechnerComponent;
      expect(() => {
        freshComponent = TestBed.createComponent(RechnerComponent).componentInstance;
      }).not.toThrow();

      expect(freshComponent.barLimit()).toBe(0);
    });

    it('does not throw when sessionStorage.setItem() throws', () => {
      spyOn(sessionStorage, 'setItem').and.throwError('Storage disabled');

      expect(() => {
        component.cycleBarLimit();
        fixture.detectChanges(); // flushes the field effect() that persists barLimit
      }).not.toThrow();
      // The in-memory update still happens even though persistence failed silently.
      expect(component.barLimit()).toBe(1);
    });
  });

  // ─── DEFAULT_DURATIONS: KI-step duration guard (RECHNER-PROZESS-VERBESSERUNGEN) ─

  describe('DEFAULT_DURATIONS KI-step duration guard', () => {
    it('the KI-labelled steps of halbautomatisch sum to 60 minutes', () => {
      // Derive the KI-step indices from the labels themselves, rather than
      // hardcoding them, so the guard tracks the domain rule (which steps are
      // "done by the AI") even if the step order or count changes.
      const works = DEFAULT_DURATIONS.halbautomatisch.works;
      const labels = PROZESS_STEP_LABELS.halbautomatisch;
      const kiSum = labels.reduce(
        (sum, label, i) => (label.startsWith('KI') ? sum + works[i] : sum),
        0,
      );

      expect(kiSum).toBe(60);
    });

    it('DEFAULT_DURATIONS.vollautomatisch.works sums to 60 minutes', () => {
      const sum = DEFAULT_DURATIONS.vollautomatisch.works.reduce((s, v) => s + v, 0);

      expect(sum).toBe(60);
    });
  });
});
