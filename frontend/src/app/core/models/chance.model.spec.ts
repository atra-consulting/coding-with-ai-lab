import { getPhaseBadgeClass } from './chance.model';

describe('getPhaseBadgeClass', () => {
  it('returns bg-primary for NEU', () => {
    expect(getPhaseBadgeClass('NEU')).toBe('bg-primary');
  });

  it('returns bg-info for QUALIFIZIERT', () => {
    expect(getPhaseBadgeClass('QUALIFIZIERT')).toBe('bg-info');
  });

  it('returns bg-warning text-dark for ANGEBOT', () => {
    expect(getPhaseBadgeClass('ANGEBOT')).toBe('bg-warning text-dark');
  });

  it('returns bg-secondary for VERHANDLUNG', () => {
    expect(getPhaseBadgeClass('VERHANDLUNG')).toBe('bg-secondary');
  });

  it('returns bg-success for GEWONNEN', () => {
    expect(getPhaseBadgeClass('GEWONNEN')).toBe('bg-success');
  });

  it('returns bg-danger for VERLOREN', () => {
    expect(getPhaseBadgeClass('VERLOREN')).toBe('bg-danger');
  });

  it('returns bg-secondary as fallback for null', () => {
    expect(getPhaseBadgeClass(null)).toBe('bg-secondary');
  });

  it('returns bg-secondary as fallback for undefined', () => {
    expect(getPhaseBadgeClass(undefined)).toBe('bg-secondary');
  });

  it('returns bg-secondary as fallback for an unknown phase value', () => {
    expect(getPhaseBadgeClass('UNKNOWN')).toBe('bg-secondary');
  });
});
