import { computeSegments, computeComparisonBars, computePieSlices, SvgSegment } from './svg-util';

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

describe('computePieSlices', () => {
  const CX = 50;
  const CY = 50;
  const R = 45;

  describe('2-slice pie (Pie A: work vs. wait)', () => {
    const result = computePieSlices(
      [
        { key: 'work', value: 70, color: '#264892', label: 'Arbeit' },
        { key: 'wait', value: 30, color: '#cf944f', label: 'Wartezeit' },
      ],
      CX,
      CY,
      R,
    );

    it('returns one slice per input', () => {
      expect(result.slices.length).toBe(2);
    });

    it('is not empty and not a full circle', () => {
      expect(result.isEmpty).toBeFalse();
      expect(result.isFullCircle).toBeFalse();
    });

    it('gives every slice a non-empty SVG path', () => {
      result.slices.forEach((s) => expect(s.path.length).toBeGreaterThan(0));
    });

    it('percentages sum to 100 (rounded to 1 decimal each)', () => {
      const total = result.slices.reduce((sum, s) => sum + s.percent, 0);
      expect(total).toBeCloseTo(100, 5);
    });
  });

  describe('3-slice pie (Pie B: role split)', () => {
    const result = computePieSlices(
      [
        { key: 'ba', value: 180, color: '#6f42c1', label: 'BA' },
        { key: 'dev', value: 640, color: '#0f766e', label: 'Dev' },
        { key: 'tester', value: 180, color: '#9a6700', label: 'Tester' },
      ],
      CX,
      CY,
      R,
    );

    it('returns one slice per input', () => {
      expect(result.slices.length).toBe(3);
    });

    it('is not empty and not a full circle', () => {
      expect(result.isEmpty).toBeFalse();
      expect(result.isFullCircle).toBeFalse();
    });

    it('gives every slice a non-empty SVG path', () => {
      result.slices.forEach((s) => expect(s.path.length).toBeGreaterThan(0));
    });
  });

  describe('zero-total pie', () => {
    const result = computePieSlices(
      [
        { key: 'work', value: 0, color: '#264892', label: 'Arbeit' },
        { key: 'wait', value: 0, color: '#cf944f', label: 'Wartezeit' },
      ],
      CX,
      CY,
      R,
    );

    it('sets isEmpty to true', () => {
      expect(result.isEmpty).toBeTrue();
    });

    it('is not a full circle', () => {
      expect(result.isFullCircle).toBeFalse();
    });

    it('gives every slice an empty path (caller renders a grey circle instead)', () => {
      result.slices.forEach((s) => expect(s.path).toBe(''));
    });
  });

  describe('single-100%-slice pie', () => {
    const result = computePieSlices(
      [
        { key: 'work', value: 90, color: '#264892', label: 'Arbeit' },
        { key: 'wait', value: 0, color: '#cf944f', label: 'Wartezeit' },
      ],
      CX,
      CY,
      R,
    );

    it('sets isFullCircle to true', () => {
      expect(result.isFullCircle).toBeTrue();
    });

    it('is not empty', () => {
      expect(result.isEmpty).toBeFalse();
    });

    it('reports the sole 100% slice color as fullCircleColor', () => {
      expect(result.fullCircleColor).toBe('#264892');
    });

    it('gives every slice an empty path (caller renders a plain circle instead of a 360° arc)', () => {
      result.slices.forEach((s) => expect(s.path).toBe(''));
    });
  });

  describe('small-share rounding (~3% of the Agile-mit-KI total)', () => {
    it('rounds a 90-of-2,970 share to "3.0", not "0"', () => {
      const result = computePieSlices(
        [
          { key: 'work', value: 90, color: '#264892', label: 'Arbeit' },
          { key: 'wait', value: 2880, color: '#cf944f', label: 'Wartezeit' },
        ],
        CX,
        CY,
        R,
      );

      const workSlice = result.slices.find((s) => s.key === 'work');
      expect(workSlice?.percent.toFixed(1)).toBe('3.0');
    });
  });
});
