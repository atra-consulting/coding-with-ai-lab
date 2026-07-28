import { ValidatorFn, Validators } from '@angular/forms';

export type ZeitEinheit = 'Minuten' | 'Stunden' | 'Tage';

export const ZEITEINHEITEN: ZeitEinheit[] = ['Minuten', 'Stunden', 'Tage'];

/** The overall duration ceiling, in minutes (479,520 = 999 workdays of 480 min). */
const MAX_MINUTEN = 479520;

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

/** Returns the max field value allowed for a given unit (479520 minutes, expressed in that unit). */
export function maxWertFuerEinheit(unit: ZeitEinheit): number {
  return MAX_MINUTEN / einheitZuFaktor(unit);
}

/** Builds the [required, min(0), max] validator set for a step value control in the given unit. */
export function durationValidatorsFor(unit: ZeitEinheit): ValidatorFn[] {
  return [Validators.required, Validators.min(0), Validators.max(maxWertFuerEinheit(unit))];
}
