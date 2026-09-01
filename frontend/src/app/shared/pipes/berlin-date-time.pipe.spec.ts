import { BerlinDateTimePipe, formatBerlinDateTime } from './berlin-date-time.pipe';

describe('formatBerlinDateTime', () => {
  it('formats a summer-time (CEST, UTC+2) timestamp', () => {
    expect(formatBerlinDateTime('2026-09-01T05:23:38.700Z')).toBe('1. Sept. 2026, 7:23');
  });

  it('formats a winter-time (CET, UTC+1) timestamp', () => {
    expect(formatBerlinDateTime('2026-01-15T10:00:00.000Z')).toBe('15. Jan. 2026, 11:00');
  });

  it('pads single-digit minutes', () => {
    expect(formatBerlinDateTime('2026-08-31T11:05:01.903Z')).toBe('31. Aug. 2026, 13:05');
  });

  it('returns "—" for null', () => {
    expect(formatBerlinDateTime(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatBerlinDateTime(undefined)).toBe('—');
  });
});

describe('BerlinDateTimePipe', () => {
  let pipe: BerlinDateTimePipe;

  beforeEach(() => {
    pipe = new BerlinDateTimePipe();
  });

  it('returns "—" for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('delegates to formatBerlinDateTime for a timestamp', () => {
    expect(pipe.transform('2026-09-01T05:23:38.700Z')).toBe('1. Sept. 2026, 7:23');
  });
});
