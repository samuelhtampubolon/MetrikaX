/**
 * P14: the arithmetic behind the chart vocabulary.
 *
 * Nothing here touches the DOM or React. A chart is mostly a coordinate transform and a string of
 * path commands, and both are worth testing on their own: a curve that is drawn wrongly is a claim
 * about data that is wrong, and it is far easier to catch in a number than in a picture.
 *
 * design_system.chart_rules governs the choices made here. Series are told apart by stroke dash
 * pattern and by marker shape, never by colour, so the two tables of patterns below are the whole
 * vocabulary a reader has to learn.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Extent {
  readonly min: number;
  readonly max: number;
}

/** The smallest extent containing every value, widened when every value is the same. */
export function extentOf(values: readonly number[]): Extent {
  if (values.length === 0) return { min: 0, max: 1 };
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === Infinity) return { min: 0, max: 1 };
  // A flat series still needs a height to be drawn in, and a zero-width domain would divide by
  // zero in the scale below.
  if (min === max)
    return min === 0
      ? { min: 0, max: 1 }
      : { min: min - Math.abs(min) / 2, max: max + Math.abs(max) / 2 };
  return { min, max };
}

/** The union of two extents, for an axis that has to hold several series. */
export function unionExtent(a: Extent, b: Extent): Extent {
  return { min: Math.min(a.min, b.min), max: Math.max(a.max, b.max) };
}

/**
 * A linear map from a data extent onto a pixel range.
 *
 * The range is given as [low, high] in data order, so a caller flips it to put larger values
 * higher up the screen rather than flipping the arithmetic.
 */
export function makeScale(
  domain: Extent,
  range: readonly [number, number],
): (value: number) => number {
  const span = domain.max - domain.min;
  const [low, high] = range;
  if (span === 0) return () => low;
  return (value: number) => low + ((value - domain.min) / span) * (high - low);
}

/**
 * Tick values at a round step covering the extent.
 *
 * Round means one, two or five times a power of ten, which is the set of steps a reader can add up
 * in their head. The count asked for is a target, not a promise: rounding the step changes how
 * many fit.
 */
export function niceTicks(extent: Extent, count = 5): number[] {
  if (count < 2) count = 2;
  const span = extent.max - extent.min;
  if (span <= 0 || !Number.isFinite(span)) return [extent.min];

  const rough = span / (count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;

  const first = Math.ceil(extent.min / step) * step;
  const ticks: number[] = [];
  for (let value = first; value <= extent.max + step / 1e6; value += step) {
    // Adding a step repeatedly accumulates binary error, so each tick is rounded back onto the
    // grid it belongs to. Without this a step of 0.1 prints as 0.30000000000000004.
    ticks.push(Number((Math.round(value / step) * step).toPrecision(12)));
  }
  return ticks;
}

/** A running total of the y values, which is how a cumulative curve is built from a series. */
export function cumulative(points: readonly Point[]): Point[] {
  let total = 0;
  return points.map((point) => {
    total += point.y;
    return { x: point.x, y: total };
  });
}

export type SeriesShape = 'line' | 'step' | 'scatter' | 'bar';

/**
 * The path commands for a polyline through already-projected points.
 *
 * `step` holds each value until the next x, which is the honest shape for a quantity that changes
 * at a moment rather than gliding between two readings.
 */
export function pathFor(points: readonly Point[], shape: 'line' | 'step'): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points as [Point, ...Point[]];
  const commands = [`M ${round(first.x)} ${round(first.y)}`];
  let previous = first;
  for (const point of rest) {
    if (shape === 'step') commands.push(`L ${round(point.x)} ${round(previous.y)}`);
    commands.push(`L ${round(point.x)} ${round(point.y)}`);
    previous = point;
  }
  return commands.join(' ');
}

/**
 * The dash patterns, in the order series are handed them.
 *
 * The first is solid. Each of the others is distinguishable from the rest at one pixel wide and in
 * print, which is the only test that matters for a vocabulary that replaces colour.
 */
export const DASH_PATTERNS: readonly string[] = Object.freeze([
  'none',
  '5 3',
  '1 3',
  '7 3 1 3',
  '3 3 1 3 1 3',
  '9 4',
]);

export type MarkerShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'plus';

export const MARKER_SHAPES: readonly MarkerShape[] = Object.freeze([
  'circle',
  'square',
  'triangle',
  'diamond',
  'cross',
  'plus',
]);

/** The dash pattern and marker shape belonging to the series at this index. */
export function seriesPattern(index: number): {
  readonly dash: string;
  readonly marker: MarkerShape;
} {
  return {
    dash: DASH_PATTERNS[index % DASH_PATTERNS.length] as string,
    marker: MARKER_SHAPES[index % MARKER_SHAPES.length] as MarkerShape,
  };
}

/**
 * A marker drawn as path commands, so every shape is one element and one stroke width.
 *
 * `size` is the full width of the marker, not its radius, so two shapes with the same size read as
 * the same weight on the page.
 */
export function markerPath(shape: MarkerShape, x: number, y: number, size = 6): string {
  const half = size / 2;
  const at = (dx: number, dy: number): string => `${round(x + dx)} ${round(y + dy)}`;

  switch (shape) {
    case 'square':
      return `M ${at(-half, -half)} L ${at(half, -half)} L ${at(half, half)} L ${at(-half, half)} Z`;
    case 'triangle':
      return `M ${at(0, -half)} L ${at(half, half)} L ${at(-half, half)} Z`;
    case 'diamond':
      return `M ${at(0, -half)} L ${at(half, 0)} L ${at(0, half)} L ${at(-half, 0)} Z`;
    case 'cross':
      return `M ${at(-half, -half)} L ${at(half, half)} M ${at(half, -half)} L ${at(-half, half)}`;
    case 'plus':
      return `M ${at(0, -half)} L ${at(0, half)} M ${at(-half, 0)} L ${at(half, 0)}`;
    case 'circle':
    default:
      // Two arcs, because a circle as a path keeps every marker one element with one stroke.
      return (
        `M ${at(-half, 0)} A ${round(half)} ${round(half)} 0 1 0 ${at(half, 0)} ` +
        `A ${round(half)} ${round(half)} 0 1 0 ${at(-half, 0)}`
      );
  }
}

/**
 * Coordinates are rounded to three decimals before they reach the markup.
 *
 * Sub-pixel precision beyond that is invisible, and the rounding is what makes the rendered path a
 * stable string: a regression test can then compare geometry rather than compare pictures.
 */
export function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
