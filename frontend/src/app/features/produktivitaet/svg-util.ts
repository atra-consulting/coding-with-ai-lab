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

/** A single named value to render as a pie slice. */
export interface PieSliceInput {
  key: string;
  value: number;
  color: string;
  label: string;
}

/** A computed pie slice: the input plus its rendered path and rounded percent share. */
export interface PieSlice extends PieSliceInput {
  /** SVG path `d` for this slice's wedge. Empty when the pie isEmpty/isFullCircle
   *  (the caller renders a plain `<circle>` in both of those cases instead). */
  path: string;
  /** This slice's share of the total, rounded to 1 decimal (so a ~3% share reads "3.0", not "0"). */
  percent: number;
  /** Centroid for an in-slice text label (white percent number). */
  labelX: number;
  labelY: number;
  /** Only show the in-slice label when the wedge is big enough to fit it (tiny slices rely on the legend). */
  showLabel: boolean;
}

export interface PieResult {
  slices: PieSlice[];
  /** True when every slice's value is 0 — nothing to show (caller renders a grey "Keine Daten" circle). */
  isEmpty: boolean;
  /** True when exactly one slice carries the whole total — a 360° arc degenerates to a point,
   *  so the caller renders a plain `<circle>` instead of a path. */
  isFullCircle: boolean;
  /** The color of the sole 100% slice when isFullCircle is true; undefined otherwise. */
  fullCircleColor?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

/** Builds the SVG path `d` for one pie wedge, clockwise from startAngle to endAngle (degrees, 0 = 12 o'clock). */
function describePieSlicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

/**
 * Computes SVG pie-slice paths and percentages for a set of named values, centered
 * at (cx, cy) with radius r. Pure and deterministic — same inputs always produce the
 * same output, so this is directly unit-testable without a DOM.
 *
 * - `isEmpty` is true when the total is 0 (all slice paths are '').
 * - `isFullCircle` is true when a single slice carries 100% of the total — a 360° arc
 *   degenerates to a zero-length path, so callers must render a `<circle>` instead.
 * - Percent is rounded to 1 decimal so small shares (~3%) still show as non-zero.
 */
export function computePieSlices(slices: PieSliceInput[], cx: number, cy: number, r: number): PieResult {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total <= 0) {
    return {
      slices: slices.map((s) => ({ ...s, path: '', percent: 0, labelX: cx, labelY: cy, showLabel: false })),
      isEmpty: true,
      isFullCircle: false,
    };
  }

  const isFullCircle = slices.filter((s) => s.value > 0).length === 1;

  let angle = 0;
  const computed = slices.map((s) => {
    const fraction = s.value / total;
    const percent = Math.round(fraction * 1000) / 10;
    const startAngle = angle;
    const endAngle = angle + fraction * 360;
    angle = endAngle;
    const full = isFullCircle && s.value > 0;
    const path = !isFullCircle && s.value > 0 ? describePieSlicePath(cx, cy, r, startAngle, endAngle) : '';
    // In-slice label centroid: centre of the wedge for a normal slice, dead centre for a full circle.
    const labelPos = full ? { x: cx, y: cy } : polarToCartesian(cx, cy, r * 0.6, (startAngle + endAngle) / 2);
    const showLabel = s.value > 0 && (full || fraction >= 0.08);
    return { ...s, path, percent, labelX: labelPos.x, labelY: labelPos.y, showLabel };
  });

  const fullCircleColor = isFullCircle ? computed.find((s) => s.value > 0)?.color : undefined;

  return { slices: computed, isEmpty: false, isFullCircle, fullCircleColor };
}
