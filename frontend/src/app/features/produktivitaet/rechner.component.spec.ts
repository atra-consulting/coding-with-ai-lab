import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RechnerComponent } from './rechner.component';
import { SzenarioService } from '../../core/services/szenario.service';
import { NotificationService } from '../../core/services/notification.service';
import { Szenario } from '../../core/models/szenario.model';
import { DEFAULT_DURATIONS, PROZESSE, ProzessKey } from '../../core/models/prozess-defaults';

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

async function setupTestBed(mockSzenarioService: jasmine.SpyObj<SzenarioService>): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [RechnerComponent],
    providers: [
      { provide: SzenarioService, useValue: mockSzenarioService },
      { provide: NotificationService, useValue: makeMockNotification() },
      { provide: NgbModal, useValue: makeModalStub() },
    ],
  }).compileComponents();
}

/** Builds a ProzessDauer with distinct, easily-asserted fill values (never matching DEFAULT_DURATIONS). */
function makeProzessDauer(workLen: number, waitLen: number, workVal: number, waitVal: number) {
  return {
    works: new Array(workLen).fill(workVal) as number[],
    waits: new Array(waitLen).fill(waitVal) as number[],
  };
}

/** A fully valid Szenario (correct array lengths for all 4 processes) with distinct, non-default values. */
function makeFullSzenario(overrides: Partial<Szenario> = {}): Szenario {
  return {
    id: 1,
    name: 'Test-Szenario',
    humanSteps: makeProzessDauer(19, 18, 100, 50),
    agileKiSteps: makeProzessDauer(19, 18, 10, 50),
    semiAutomatedSteps: makeProzessDauer(7, 6, 20, 15),
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

// ─── Component creation ─────────────────────────────────────────────────────

describe('RechnerComponent — creation', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates without errors', () => {
    expect(component).toBeTruthy();
  });

  it('calls SzenarioService.list() on init', () => {
    const mockService = TestBed.inject(SzenarioService) as jasmine.SpyObj<SzenarioService>;
    expect(mockService.list).toHaveBeenCalledTimes(1);
  });
});

// ─── Unit conversion (R5) — the component's unit-change handler ─────────────

describe('RechnerComponent — unit conversion handler (R5)', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

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

// ─── Scenario load: no conversion pipeline + positive refresh ───────────────

describe('RechnerComponent — ladeScenario() does not run the unit-conversion pipeline', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('a step left on "Stunden" before load ends up with the raw loaded minute value, not a converted one', () => {
    const { value, unit } = stepControls(component, 'halbautomatisch', 1);
    unit.setValue('Stunden');
    value.setValue(10); // stands in for "10 Stunden", set before the load

    const szenario = makeFullSzenario({
      semiAutomatedSteps: { works: [0, 777, 15, 15, 10, 30, 20], waits: [5, 60, 60, 5, 60, 5] },
    });
    component.ladeScenario(szenario);

    // If the conversion pipeline had (incorrectly) fired on load, it would have
    // recomputed a value derived from the stale pre-load state — not the exact
    // stored minute value of 777.
    expect(unit.value).toBe('Minuten');
    expect(value.value).toBe(777);
  });
});

describe('RechnerComponent — ladeScenario() resets a Tage-scale validator back to Minuten', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

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

describe('RechnerComponent — ladeScenario() refresh (guards the post-load recompute)', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('getProzessTotal() reflects the loaded menschlich total after ladeScenario()', () => {
    const szenario = makeFullSzenario();
    component.ladeScenario(szenario);

    // menschlich: 19 works * 100 + 18 waits * 50 = 1900 + 900 = 2800
    expect(component.getProzessTotal(0)).toBe(2800);
  });

  it('getProzessTotal() reflects the loaded vollautomatisch total after ladeScenario()', () => {
    const szenario = makeFullSzenario();
    component.ladeScenario(szenario);

    // vollautomatisch: 2 works * 30 + 1 wait * 5 = 60 + 5 = 65
    expect(component.getProzessTotal(3)).toBe(65);
  });

  it('svgSnapshot() works array reflects the loaded values after ladeScenario()', () => {
    const szenario = makeFullSzenario();
    component.ladeScenario(szenario);

    const snap = component.svgSnapshot().prozesse[0];
    expect(snap.works).toEqual(new Array(19).fill(100));
    expect(snap.waits).toEqual(new Array(18).fill(50));
  });

  it('the form value reflects the loaded works array after ladeScenario()', () => {
    const szenario = makeFullSzenario();
    component.ladeScenario(szenario);

    const worksArray = component.getWorksArray('menschlich');
    expect(component.getValueCtrl(worksArray.at(0) as FormGroup).value).toBe(100);
  });
});

// ─── Scenario-load fallback for mismatched/missing process data ────────────

describe('RechnerComponent — ladeScenario() falls back to defaults on mismatched process data', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not throw when a process array has the wrong length', () => {
    const szenario = makeFullSzenario({
      // halbautomatisch expects 7 works — this one has only 5 (wrong length)
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

// ─── Role split (getRollenSplit) ────────────────────────────────────────────

describe('RechnerComponent — getRollenSplit()', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sums to the 1,000-minute work total for menschlich (index 0)', () => {
    const split = component.getRollenSplit(0);
    expect(split).not.toBeNull();
    expect(split!.ba + split!.dev + split!.tester).toBe(1000);
  });

  it('sums to the 90-minute work total for agileKi (index 1)', () => {
    const split = component.getRollenSplit(1);
    expect(split).not.toBeNull();
    expect(split!.ba + split!.dev + split!.tester).toBe(90);
  });

  it('returns null for halbautomatisch (index 2, no role assignment)', () => {
    expect(component.getRollenSplit(2)).toBeNull();
  });

  it('returns null for vollautomatisch (index 3, no role assignment)', () => {
    expect(component.getRollenSplit(3)).toBeNull();
  });
});

// ─── Flowchart data (getFlowchartSchritte) ──────────────────────────────────

describe('RechnerComponent — getFlowchartSchritte()', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

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

// ─── DOM: tab strip, no old titles, flowchart aria-labels (R2/R4) ───────────

describe('RechnerComponent — DOM: single 4-tab strip, no old process names (R2)', () => {
  let fixture: ComponentFixture<RechnerComponent>;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    fixture.detectChanges();
  });

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

describe('RechnerComponent — DOM: flowchart box aria-labels (R4)', () => {
  let fixture: ComponentFixture<RechnerComponent>;
  let component: RechnerComponent;

  beforeEach(async () => {
    await setupTestBed(makeMockSzenarioService());
    fixture = TestBed.createComponent(RechnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('every flowchart box has a non-empty aria-label, on every one of the four tabs', () => {
    const tabButtons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      'ul.nav-tabs > li button',
    );
    expect(tabButtons.length).toBe(4);

    for (let i = 0; i < PROZESSE.length; i++) {
      tabButtons[i].click();
      fixture.detectChanges();
      component.setViewMode('flussdiagramm');
      fixture.detectChanges();

      const boxes: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.flow-box');
      expect(boxes.length).toBe(PROZESSE[i].stepCount);
      boxes.forEach((box) => {
        expect((box.getAttribute('aria-label') ?? '').trim().length).toBeGreaterThan(0);
      });
    }
  });
});
