export interface SvgSegment {
  x: number;
  width: number;
  type: 'work' | 'wait';
  index: number;
}

export interface ComparisonBar {
  width: number;
}

/**
 * Computes SVG segments for a single process bar.
 * Ordering: work(0), wait(0), work(1), wait(1), ..., work(N-1).
 * N work segments + N-1 wait segments. First and last are always work.
 * Widths are proportional to each segment's share of the process total.
 * If total is 0, all segments get zero width.
 */
export function computeSegments(
  works: number[],
  waits: number[],
  width: number,
): SvgSegment[] {
  const total = works.reduce((s, v) => s + v, 0) + waits.reduce((s, v) => s + v, 0);
  const segments: SvgSegment[] = [];
  let x = 0;

  for (let i = 0; i < works.length; i++) {
    const segWidth = total > 0 ? (works[i] / total) * width : 0;
    segments.push({ x, width: segWidth, type: 'work', index: i });
    x += segWidth;

    if (i < waits.length) {
      const waitWidth = total > 0 ? (waits[i] / total) * width : 0;
      segments.push({ x, width: waitWidth, type: 'wait', index: i });
      x += waitWidth;
    }
  }

  return segments;
}

/**
 * Computes comparison bar widths for multiple processes on a shared scale.
 * The largest total maps to full width; others are proportional.
 * If all totals are zero, all widths are zero.
 */
export function computeComparisonBars(totals: number[], width: number): ComparisonBar[] {
  const maxTotal = Math.max(...totals, 0);
  return totals.map((total) => ({
    width: maxTotal > 0 ? (total / maxTotal) * width : 0,
  }));
}
