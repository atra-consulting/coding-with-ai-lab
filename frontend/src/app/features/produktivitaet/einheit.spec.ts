import { einheitZuFaktor, feldWertZuMinuten, ZEITEINHEITEN, ZeitEinheit } from './einheit';

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
