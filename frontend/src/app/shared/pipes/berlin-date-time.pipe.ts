import { formatDate, registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { Pipe, PipeTransform } from '@angular/core';

// Registered here (not just in main.ts) so formatDate finds 'de-DE' data
// regardless of bootstrap order — this matters in Karma specs, which don't run main.ts.
registerLocaleData(localeDe, 'de-DE');

const BERLIN_DATE_TIME_FORMAT = 'd. MMM y, H:mm';

/**
 * Formats a timestamp as short German text in Europe/Berlin time, e.g. "1. Sept. 2026, 7:23".
 * Handles CET/CEST conversion regardless of the browser's local timezone.
 */
export function formatBerlinDateTime(value: string | number | Date | null | undefined): string {
  if (value == null) return '—';
  return formatDate(value, BERLIN_DATE_TIME_FORMAT, 'de-DE', 'Europe/Berlin');
}

@Pipe({ name: 'berlinDateTime' })
export class BerlinDateTimePipe implements PipeTransform {
  transform(value: string | number | Date | null | undefined): string {
    return formatBerlinDateTime(value);
  }
}
