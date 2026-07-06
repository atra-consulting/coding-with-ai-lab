import { DEFAULT_DURATIONS, PROZESS_ROLLEN, PROZESS_STEP_LABELS, PROZESSE, Rolle } from './prozess-defaults';

function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

function total(p: { works: number[]; waits: number[] }): number {
  return sum(p.works) + sum(p.waits);
}

// ─── Canonical arrays (PLAN-RECHNER-OVERHAUL §Canonical default durations) ────

describe('DEFAULT_DURATIONS — canonical arrays', () => {
  it('menschlich works matches the canonical 19-element array', () => {
    expect(DEFAULT_DURATIONS.menschlich.works).toEqual([
      0, 60, 30, 60, 30, 15, 240, 30, 60, 60, 30, 15, 120, 15, 120, 20, 20, 15, 60,
    ]);
  });

  it('menschlich waits matches the canonical 18-element array', () => {
    expect(DEFAULT_DURATIONS.menschlich.waits).toEqual([
      120, 120, 120, 960, 480, 0, 30, 120, 120, 120, 30, 240, 60, 0, 30, 240, 30, 60,
    ]);
  });

  it('agileKi works matches the canonical 19-element array', () => {
    expect(DEFAULT_DURATIONS.agileKi.works).toEqual([
      0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    ]);
  });

  it('agileKi waits is the same array reference as menschlich waits', () => {
    expect(DEFAULT_DURATIONS.agileKi.waits).toBe(DEFAULT_DURATIONS.menschlich.waits);
  });

  it('halbautomatisch works matches the canonical 7-element array', () => {
    expect(DEFAULT_DURATIONS.halbautomatisch.works).toEqual([0, 5, 15, 15, 10, 30, 20]);
  });

  it('halbautomatisch waits matches the canonical 6-element array', () => {
    expect(DEFAULT_DURATIONS.halbautomatisch.waits).toEqual([5, 60, 60, 5, 60, 5]);
  });

  it('vollautomatisch works matches the canonical 2-element array', () => {
    expect(DEFAULT_DURATIONS.vollautomatisch.works).toEqual([0, 20]);
  });

  it('vollautomatisch waits matches the canonical 1-element array [5] (changed from [240])', () => {
    expect(DEFAULT_DURATIONS.vollautomatisch.waits).toEqual([5]);
  });
});

describe('DEFAULT_DURATIONS — totals', () => {
  it('menschlich totals 3,880 minutes (work 1,000 + wait 2,880)', () => {
    expect(total(DEFAULT_DURATIONS.menschlich)).toBe(3880);
  });

  it('agileKi totals 2,970 minutes (work 90 + wait 2,880)', () => {
    expect(total(DEFAULT_DURATIONS.agileKi)).toBe(2970);
  });

  it('halbautomatisch totals 290 minutes (work 95 + wait 195)', () => {
    expect(total(DEFAULT_DURATIONS.halbautomatisch)).toBe(290);
  });

  it('vollautomatisch totals 25 minutes (work 20 + wait 5)', () => {
    expect(total(DEFAULT_DURATIONS.vollautomatisch)).toBe(25);
  });
});

// ─── PROZESSE — R1 order, titles, step counts ─────────────────────────────────

describe('PROZESSE — R1 order, titles, step counts', () => {
  it('has exactly 4 entries', () => {
    expect(PROZESSE.length).toBe(4);
  });

  it('lists keys in R1 order: menschlich, agileKi, halbautomatisch, vollautomatisch', () => {
    expect(PROZESSE.map((p) => p.key)).toEqual([
      'menschlich',
      'agileKi',
      'halbautomatisch',
      'vollautomatisch',
    ]);
  });

  it('has step counts 19/19/7/2 in R1 order', () => {
    expect(PROZESSE.map((p) => p.stepCount)).toEqual([19, 19, 7, 2]);
  });

  it('has the R1a process titles in order, with no leftover old titles', () => {
    expect(PROZESSE.map((p) => p.titel)).toEqual([
      'Agile mit Menschen',
      'Agile mit KI',
      'KI-Prozess mit Feedback',
      'KI-Prozess vollautomatisch',
    ]);
  });

  it('gives the two agile processes an "Arbeitszeit" label and the two KI processes a "KI-Arbeitszeit" label', () => {
    expect(PROZESSE.map((p) => p.arbeitszeitLabel)).toEqual([
      'Arbeitszeit',
      'Arbeitszeit',
      'KI-Arbeitszeit',
      'KI-Arbeitszeit',
    ]);
  });
});

// ─── PROZESS_STEP_LABELS — agileKi reuses menschlich labels ───────────────────

describe('PROZESS_STEP_LABELS', () => {
  it('agileKi is the same array reference as menschlich (identical process steps)', () => {
    expect(PROZESS_STEP_LABELS.agileKi).toBe(PROZESS_STEP_LABELS.menschlich);
  });

  it('menschlich has 19 labels', () => {
    expect(PROZESS_STEP_LABELS.menschlich.length).toBe(19);
  });

  it('halbautomatisch has 7 labels', () => {
    expect(PROZESS_STEP_LABELS.halbautomatisch.length).toBe(7);
  });

  it('vollautomatisch has 2 labels', () => {
    expect(PROZESS_STEP_LABELS.vollautomatisch.length).toBe(2);
  });

  it("each PROZESSE descriptor's labels array matches PROZESS_STEP_LABELS for its key", () => {
    for (const p of PROZESSE) {
      expect(p.labels).toBe(PROZESS_STEP_LABELS[p.key]);
    }
  });
});

// ─── PROZESS_ROLLEN — role map (agile processes only) ─────────────────────────

describe('PROZESS_ROLLEN', () => {
  it('agileKi is the same array reference as menschlich (identical role assignment)', () => {
    expect(PROZESS_ROLLEN.agileKi).toBe(PROZESS_ROLLEN.menschlich);
  });

  it('has 19 entries with a null role only at index 0 (the trigger step)', () => {
    expect(PROZESS_ROLLEN.menschlich.length).toBe(19);
    expect(PROZESS_ROLLEN.menschlich[0]).toBeNull();
    PROZESS_ROLLEN.menschlich.slice(1).forEach((rolle) => expect(rolle).not.toBeNull());
  });

  function rollenSumme(works: number[]): Record<Rolle, number> {
    const totals: Record<Rolle, number> = { BA: 0, Dev: 0, Tester: 0 };
    works.forEach((min, i) => {
      const rolle = PROZESS_ROLLEN.menschlich[i];
      if (rolle) totals[rolle] += min;
    });
    return totals;
  }

  it('menschlich work minutes split BA 180 + Dev 640 + Tester 180 = 1,000', () => {
    const totals = rollenSumme(DEFAULT_DURATIONS.menschlich.works);
    expect(totals.BA).toBe(180);
    expect(totals.Dev).toBe(640);
    expect(totals.Tester).toBe(180);
    expect(totals.BA + totals.Dev + totals.Tester).toBe(1000);
  });

  it('agileKi work minutes split 20 + 60 + 10 = 90', () => {
    const totals = rollenSumme(DEFAULT_DURATIONS.agileKi.works);
    expect(totals.BA).toBe(20);
    expect(totals.Dev).toBe(60);
    expect(totals.Tester).toBe(10);
    expect(totals.BA + totals.Dev + totals.Tester).toBe(90);
  });
});
