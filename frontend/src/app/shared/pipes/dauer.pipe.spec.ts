import { DauerPipe, minutenZuDauer } from './dauer.pipe';

describe('minutenZuDauer', () => {
  it('returns "0m" for 0 minutes', () => {
    expect(minutenZuDauer(0)).toBe('0m');
  });

  it('returns "30m" for 30 minutes', () => {
    expect(minutenZuDauer(30)).toBe('30m');
  });

  it('returns "1h 30m" for 90 minutes', () => {
    expect(minutenZuDauer(90)).toBe('1h 30m');
  });

  it('returns "1d" for 480 minutes (one full workday)', () => {
    expect(minutenZuDauer(480)).toBe('1d');
  });

  it('returns "1d 30m" for 510 minutes', () => {
    expect(minutenZuDauer(510)).toBe('1d 30m');
  });

  it('returns "3d" for 1440 minutes', () => {
    expect(minutenZuDauer(1440)).toBe('3d');
  });

  it('returns "1h" for 60 minutes (drops the 0m part)', () => {
    expect(minutenZuDauer(60)).toBe('1h');
  });

  it('returns "1d 1h" for 540 minutes (one day + one hour)', () => {
    expect(minutenZuDauer(540)).toBe('1d 1h');
  });

  it('returns "1d 1h 30m" for 570 minutes', () => {
    expect(minutenZuDauer(570)).toBe('1d 1h 30m');
  });

  it('returns "2d" for 960 minutes', () => {
    expect(minutenZuDauer(960)).toBe('2d');
  });
});

describe('DauerPipe', () => {
  let pipe: DauerPipe;

  beforeEach(() => {
    pipe = new DauerPipe();
  });

  it('returns "-" for null', () => {
    expect(pipe.transform(null)).toBe('-');
  });

  it('returns "-" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('-');
  });

  it('delegates to minutenZuDauer for numeric values', () => {
    expect(pipe.transform(1440)).toBe('3d');
    expect(pipe.transform(90)).toBe('1h 30m');
    expect(pipe.transform(0)).toBe('0m');
  });
});
