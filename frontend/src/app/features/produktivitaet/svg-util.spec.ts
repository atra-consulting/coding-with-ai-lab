import { computeSegments, computeComparisonBars, SvgSegment } from './svg-util';

describe('computeSegments', () => {
  const WIDTH = 100;

  describe('segment ordering and types', () => {
    it('first segment is type "work"', () => {
      const segs = computeSegments([10, 20], [30], WIDTH);
      expect(segs[0].type).toBe('work');
    });

    it('last segment is type "work"', () => {
      const segs = computeSegments([10, 20], [30], WIDTH);
      expect(segs[segs.length - 1].type).toBe('work');
    });

    it('produces N work segments and N-1 wait segments for N steps', () => {
      const works = [10, 20, 30];
      const waits = [5, 15];
      const segs = computeSegments(works, waits, WIDTH);
      const workSegs = segs.filter((s) => s.type === 'work');
      const waitSegs = segs.filter((s) => s.type === 'wait');
      expect(workSegs.length).toBe(3);
      expect(waitSegs.length).toBe(2);
    });

    it('interleaves work and wait: work, wait, work, wait, work', () => {
      const segs = computeSegments([10, 20, 30], [5, 15], WIDTH);
      expect(segs.map((s) => s.type)).toEqual(['work', 'wait', 'work', 'wait', 'work']);
    });

    it('produces 1 work segment and 0 wait segments for a single step', () => {
      const segs = computeSegments([60], [], WIDTH);
      expect(segs.length).toBe(1);
      expect(segs[0].type).toBe('work');
    });
  });

  describe('segment widths', () => {
    it('widths sum to the given width when total > 0', () => {
      const works = [60, 120, 60];
      const waits = [240, 480];
      const segs = computeSegments(works, waits, WIDTH);
      const totalWidth = segs.reduce((sum, s) => sum + s.width, 0);
      expect(totalWidth).toBeCloseTo(WIDTH, 5);
    });

    it('widths are proportional to each segment share of process total', () => {
      const works = [100, 0];
      const waits = [100];
      // total = 200; work[0]=100→50%, wait[0]=100→50%, work[1]=0→0%
      const segs = computeSegments(works, waits, WIDTH);
      expect(segs[0].width).toBeCloseTo(50, 5);
      expect(segs[1].width).toBeCloseTo(50, 5);
      expect(segs[2].width).toBeCloseTo(0, 5);
    });

    it('all segment widths are 0 when process total is 0', () => {
      const segs = computeSegments([0, 0], [0], WIDTH);
      segs.forEach((s) => expect(s.width).toBe(0));
    });
  });

  describe('segment x positions', () => {
    it('first segment starts at x=0', () => {
      const segs = computeSegments([10, 20], [30], WIDTH);
      expect(segs[0].x).toBe(0);
    });

    it('each segment x equals the sum of all previous widths', () => {
      const works = [60, 60];
      const waits = [120];
      const segs = computeSegments(works, waits, WIDTH);
      // total=240; work[0]=60→25%, wait[0]=120→50%, work[1]=60→25%
      expect(segs[0].x).toBeCloseTo(0, 5);
      expect(segs[1].x).toBeCloseTo(25, 5);
      expect(segs[2].x).toBeCloseTo(75, 5);
    });
  });

  describe('segment indices', () => {
    it('assigns index matching the step position for work segments', () => {
      const segs = computeSegments([10, 20, 30], [5, 15], WIDTH);
      const workSegs = segs.filter((s) => s.type === 'work');
      expect(workSegs[0].index).toBe(0);
      expect(workSegs[1].index).toBe(1);
      expect(workSegs[2].index).toBe(2);
    });

    it('assigns index matching the gap position for wait segments', () => {
      const segs = computeSegments([10, 20, 30], [5, 15], WIDTH);
      const waitSegs = segs.filter((s) => s.type === 'wait');
      expect(waitSegs[0].index).toBe(0);
      expect(waitSegs[1].index).toBe(1);
    });
  });
});

describe('computeComparisonBars', () => {
  const WIDTH = 200;

  it('maps the largest total to full width', () => {
    const bars = computeComparisonBars([100, 50, 25], WIDTH);
    expect(bars[0].width).toBeCloseTo(WIDTH, 5);
  });

  it('maps smaller totals proportionally', () => {
    const bars = computeComparisonBars([100, 50, 25], WIDTH);
    expect(bars[1].width).toBeCloseTo(100, 5);
    expect(bars[2].width).toBeCloseTo(50, 5);
  });

  it('all widths are 0 when all totals are 0', () => {
    const bars = computeComparisonBars([0, 0, 0], WIDTH);
    bars.forEach((b) => expect(b.width).toBe(0));
  });

  it('returns one bar per total', () => {
    const bars = computeComparisonBars([10, 20, 30], WIDTH);
    expect(bars.length).toBe(3);
  });

  it('maps a single total to full width', () => {
    const bars = computeComparisonBars([42], WIDTH);
    expect(bars[0].width).toBeCloseTo(WIDTH, 5);
  });

  it('a total of 0 maps to 0 width when other totals are non-zero', () => {
    const bars = computeComparisonBars([100, 0], WIDTH);
    expect(bars[1].width).toBeCloseTo(0, 5);
  });

  it('uses width of 0 for an empty totals array', () => {
    const bars = computeComparisonBars([], WIDTH);
    expect(bars.length).toBe(0);
  });
});
