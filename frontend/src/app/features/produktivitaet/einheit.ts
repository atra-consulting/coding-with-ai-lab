export type ZeitEinheit = 'Minuten' | 'Stunden' | 'Tage';

export const ZEITEINHEITEN: ZeitEinheit[] = ['Minuten', 'Stunden', 'Tage'];

/** Returns the minute multiplier for a given unit (1h=60, 1d=480). */
export function einheitZuFaktor(unit: ZeitEinheit): number {
  switch (unit) {
    case 'Minuten':
      return 1;
    case 'Stunden':
      return 60;
    case 'Tage':
      return 480;
  }
}

/** Converts a numeric field value + unit to integer minutes. */
export function feldWertZuMinuten(value: number, unit: ZeitEinheit): number {
  return Math.round(value * einheitZuFaktor(unit));
}
