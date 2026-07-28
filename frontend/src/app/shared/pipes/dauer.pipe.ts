import { Pipe, PipeTransform } from '@angular/core';

const MINUTEN_PRO_TAG = 480;
const MINUTEN_PRO_STUNDE = 60;

/**
 * Converts minutes to a human-readable duration string (D6 format).
 * 1 day = 480 min (8-hour workday), 1 hour = 60 min.
 * Drops leading zero units; always keeps at least one unit.
 * Examples: 0→'0m', 30→'30m', 90→'1h 30m', 480→'1d', 510→'1d 30m', 1440→'3d'.
 */
export function minutenZuDauer(minuten: number): string {
  if (minuten === 0) return '0m';

  const tage = Math.floor(minuten / MINUTEN_PRO_TAG);
  const rest = minuten % MINUTEN_PRO_TAG;
  const stunden = Math.floor(rest / MINUTEN_PRO_STUNDE);
  const minRest = rest % MINUTEN_PRO_STUNDE;

  const parts: string[] = [];
  if (tage > 0) parts.push(`${tage}d`);
  if (stunden > 0) parts.push(`${stunden}h`);
  if (minRest > 0) parts.push(`${minRest}m`);

  return parts.join(' ');
}

@Pipe({ name: 'dauer' })
export class DauerPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '-';
    return minutenZuDauer(value);
  }
}
