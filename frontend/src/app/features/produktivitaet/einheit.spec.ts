import { FormControl } from '@angular/forms';
import {
  durationValidatorsFor,
  einheitZuFaktor,
  feldWertZuMinuten,
  maxWertFuerEinheit,
  ZEITEINHEITEN,
  ZeitEinheit,
} from './einheit';

describe('ZEITEINHEITEN', () => {
  it('contains Minuten, Stunden, and Tage', () => {
    expect(ZEITEINHEITEN).toEqual(['Minuten', 'Stunden', 'Tage']);
  });
});

describe('einheitZuFaktor', () => {
  it('returns 1 for Minuten', () => {
    expect(einheitZuFaktor('Minuten')).toBe(1);
  });

  it('returns 60 for Stunden', () => {
    expect(einheitZuFaktor('Stunden')).toBe(60);
  });

  it('returns 480 for Tage', () => {
    expect(einheitZuFaktor('Tage')).toBe(480);
  });
});

describe('feldWertZuMinuten', () => {
  it('converts 5 Minuten to 5', () => {
    expect(feldWertZuMinuten(5, 'Minuten')).toBe(5);
  });

  it('converts 1 Stunden to 60', () => {
    expect(feldWertZuMinuten(1, 'Stunden')).toBe(60);
  });

  it('converts 2 Tage to 960', () => {
    expect(feldWertZuMinuten(2, 'Tage')).toBe(960);
  });

  it('converts 0 of any unit to 0', () => {
    expect(feldWertZuMinuten(0, 'Minuten')).toBe(0);
    expect(feldWertZuMinuten(0, 'Stunden')).toBe(0);
    expect(feldWertZuMinuten(0, 'Tage')).toBe(0);
  });

  it('rounds fractional minutes to the nearest integer', () => {
    expect(feldWertZuMinuten(1.5, 'Stunden')).toBe(90);
  });

  it('converts 3 Tage to 1440', () => {
    expect(feldWertZuMinuten(3, 'Tage')).toBe(1440);
  });
});

describe('maxWertFuerEinheit', () => {
  it('returns 479520 for Minuten (the overall minute ceiling itself)', () => {
    expect(maxWertFuerEinheit('Minuten')).toBe(479520);
  });

  it('returns 7992 for Stunden (479520 / 60)', () => {
    expect(maxWertFuerEinheit('Stunden')).toBe(7992);
  });

  it('returns 999 for Tage (479520 / 480)', () => {
    expect(maxWertFuerEinheit('Tage')).toBe(999);
  });
});

describe('durationValidatorsFor', () => {
  it('rejects a value above the unit-scale max', () => {
    const ctrl = new FormControl(1000, durationValidatorsFor('Tage'));
    expect(ctrl.invalid).toBeTrue();
    expect(ctrl.errors?.['max']).toBeTruthy();
  });

  it('accepts a value at the unit-scale max', () => {
    const ctrl = new FormControl(999, durationValidatorsFor('Tage'));
    expect(ctrl.valid).toBeTrue();
  });

  it('rejects a negative value', () => {
    const ctrl = new FormControl(-1, durationValidatorsFor('Minuten'));
    expect(ctrl.invalid).toBeTrue();
    expect(ctrl.errors?.['min']).toBeTruthy();
  });

  it('rejects a missing (null) value as required', () => {
    const ctrl = new FormControl(null, durationValidatorsFor('Minuten'));
    expect(ctrl.invalid).toBeTrue();
    expect(ctrl.errors?.['required']).toBeTruthy();
  });

  it('a Minuten-scale max (479520) accepts a large value that a Tage-scale max (999) would reject', () => {
    const ctrl = new FormControl(5000, durationValidatorsFor('Minuten'));
    expect(ctrl.valid).toBeTrue();
  });
});

describe('R5 round-trip unit conversion (240 Min → 4 Std → 0.5 Tage → back)', () => {
  // Mirrors the conversion formula used by the component's unit-change handler:
  // value(from) → minutes → value(to), rounded to at most 2 decimals.
  function convert(value: number, from: ZeitEinheit, to: ZeitEinheit): number {
    const minuten = feldWertZuMinuten(value, from);
    return Math.round((minuten / einheitZuFaktor(to)) * 100) / 100;
  }

  it('240 Minuten equals 4 Stunden', () => {
    expect(convert(240, 'Minuten', 'Stunden')).toBe(4);
  });

  it('4 Stunden equals 0.5 Tage', () => {
    expect(convert(4, 'Stunden', 'Tage')).toBe(0.5);
  });

  it('0.5 Tage converts back to 240 Minuten', () => {
    expect(convert(0.5, 'Tage', 'Minuten')).toBe(240);
  });

  it('rounds a non-terminating conversion to at most 2 decimals (100 Minuten → 1.67 Stunden)', () => {
    expect(convert(100, 'Minuten', 'Stunden')).toBe(1.67);
  });

  it('round-trips within tolerance for an arbitrary value (37 Minuten → Stunden → Minuten)', () => {
    const asStunden = convert(37, 'Minuten', 'Stunden');
    const backToMinuten = convert(asStunden, 'Stunden', 'Minuten');
    expect(backToMinuten).toBeCloseTo(37, 0);
  });
});
