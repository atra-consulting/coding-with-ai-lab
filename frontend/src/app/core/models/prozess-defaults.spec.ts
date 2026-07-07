import {
  DEFAULT_DURATIONS,
  PROZESS_ANNAHMEN,
  PROZESS_CAPTION,
  PROZESS_ROLLEN,
  PROZESS_STEP_LABELS,
  PROZESSE,
  Rolle,
} from './prozess-defaults';

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

  it('agileKi waits matches the canonical 18-element array (own array, halved from step 5 onward)', () => {
    expect(DEFAULT_DURATIONS.agileKi.waits).toEqual([
      120, 120, 120, 960, 240, 0, 15, 60, 60, 60, 15, 120, 30, 0, 15, 120, 15, 30,
    ]);
  });

  it('agileKi waits is NOT the same array reference as menschlich waits (own array)', () => {
    expect(DEFAULT_DURATIONS.agileKi.waits).not.toBe(DEFAULT_DURATIONS.menschlich.waits);
  });

  it('agileKi waits equals menschlich waits for steps 1-4 and is halved from step 5 onward', () => {
    const menschlich = DEFAULT_DURATIONS.menschlich.waits;
    const agileKi = DEFAULT_DURATIONS.agileKi.waits;
    expect(agileKi.slice(0, 4)).toEqual(menschlich.slice(0, 4));
    expect(agileKi.slice(4)).toEqual(menschlich.slice(4).map((min) => min / 2));
  });

  it('halbautomatisch works matches the canonical 11-element array', () => {
    expect(DEFAULT_DURATIONS.halbautomatisch.works).toEqual([0, 5, 10, 10, 5, 10, 10, 5, 10, 30, 20]);
  });

  it('halbautomatisch waits matches the canonical 10-element array', () => {
    expect(DEFAULT_DURATIONS.halbautomatisch.waits).toEqual([5, 60, 5, 60, 60, 5, 60, 5, 60, 5]);
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

  it('agileKi totals 2,190 minutes (work 90 + wait 2,100)', () => {
    expect(total(DEFAULT_DURATIONS.agileKi)).toBe(2190);
  });

  it('halbautomatisch totals 440 minutes (work 115 + wait 325)', () => {
    expect(total(DEFAULT_DURATIONS.halbautomatisch)).toBe(440);
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

  it('has step counts 19/19/11/2 in R1 order', () => {
    expect(PROZESSE.map((p) => p.stepCount)).toEqual([19, 19, 11, 2]);
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

  it('halbautomatisch has 11 labels', () => {
    expect(PROZESS_STEP_LABELS.halbautomatisch.length).toBe(11);
  });

  it('vollautomatisch has 2 labels', () => {
    expect(PROZESS_STEP_LABELS.vollautomatisch.length).toBe(2);
  });

  it("each PROZESSE descriptor's labels array matches PROZESS_STEP_LABELS for its key", () => {
    for (const p of PROZESSE) {
      expect(p.labels).toBe(PROZESS_STEP_LABELS[p.key]);
    }
  });

  it('contains the three renamed "Business Analyst" menschlich labels (indices 1-3)', () => {
    expect(PROZESS_STEP_LABELS.menschlich[1]).toBe('Business Analyst analysiert die Situation');
    expect(PROZESS_STEP_LABELS.menschlich[2]).toBe('Business Analyst bespricht mit Entwickler');
    expect(PROZESS_STEP_LABELS.menschlich[3]).toBe('Business Analyst schreibt Ticket');
  });
});

// ─── PROZESS_ANNAHMEN — two simplifying-assumption bullets per process ────────

describe('PROZESS_ANNAHMEN', () => {
  it('has exactly 2 bullets for each of the 4 processes', () => {
    for (const p of PROZESSE) {
      expect(PROZESS_ANNAHMEN[p.key].length).toBe(2);
    }
  });

  it('has the exact bullet text for menschlich', () => {
    expect(PROZESS_ANNAHMEN.menschlich).toEqual(['Mensch macht alles', 'Mensch macht Fehler']);
  });

  it('has the exact bullet text for agileKi', () => {
    expect(PROZESS_ANNAHMEN.agileKi).toEqual(['KI macht alles', 'KI macht Fehler']);
  });

  it('has the exact bullet text for halbautomatisch', () => {
    expect(PROZESS_ANNAHMEN.halbautomatisch).toEqual(['KI macht alles', 'Ausführung fehlerfrei']);
  });

  it('has the exact bullet text for vollautomatisch', () => {
    expect(PROZESS_ANNAHMEN.vollautomatisch).toEqual([
      'KI macht alles',
      'Planung und Ausführung fehlerfrei',
    ]);
  });
});

// ─── PROZESS_CAPTION — agileKi only ───────────────────────────────────────────

describe('PROZESS_CAPTION', () => {
  it('has the exact caption text for agileKi', () => {
    expect(PROZESS_CAPTION.agileKi).toBe(
      'Agiler Prozess mit Refinement und PR-Review, Business Analyst, Entwickler, Tester',
    );
  });

  it('is undefined for the other three processes', () => {
    expect(PROZESS_CAPTION.menschlich).toBeUndefined();
    expect(PROZESS_CAPTION.halbautomatisch).toBeUndefined();
    expect(PROZESS_CAPTION.vollautomatisch).toBeUndefined();
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
