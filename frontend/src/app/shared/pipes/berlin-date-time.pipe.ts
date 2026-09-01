import { Pipe, PipeTransform } from '@angular/core';

// Angular's formatDate() with an IANA timezone name parses an Intl "longOffset"
// string internally and silently falls back to 0 offset when that parsing fails
// (observed on Linux CI's Chrome build). Intl.DateTimeFormat's own timeZone
// handling doesn't go through that parsing step, so it stays correct everywhere.
const BERLIN_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Europe/Berlin',
});

/**
 * Formats a timestamp as short German text in Europe/Berlin time, e.g. "1. Sept. 2026, 7:23".
 * Handles CET/CEST conversion regardless of the browser's local timezone.
 */
export function formatBerlinDateTime(value: string | number | Date | null | undefined): string {
  if (value == null) return '—';
  return BERLIN_DATE_TIME_FORMATTER.format(new Date(value));
}

@Pipe({ name: 'berlinDateTime' })
export class BerlinDateTimePipe implements PipeTransform {
  transform(value: string | number | Date | null | undefined): string {
    return formatBerlinDateTime(value);
  }
}
