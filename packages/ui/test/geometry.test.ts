/**
 * P14: the arithmetic behind the charts.
 *
 * A chart is a claim about data drawn as a picture, and the picture is the part a reader cannot
 * check. These tests check the part they cannot see: the scale, the ticks, the path commands and
 * the markers.
 */

import { describe, expect, it } from 'vitest';
import {
  cumulative,
  extentOf,
  makeScale,
  markerPath,
  niceTicks,
  pathFor,
  seriesPattern,
  unionExtent,
  DASH_PATTERNS,
  MARKER_SHAPES,
} from '../src/charts/geometry.ts';

describe('extents', () => {
  it('spans the smallest and the largest value', () => {
    expect(extentOf([3, 1, 9, 4])).toEqual({ min: 1, max: 9 });
  });

  it('gives a flat series a height, rather than a domain of zero width', () => {
    const extent = extentOf([5, 5, 5]);
    expect(extent.min).toBeLessThan(5);
    expect(extent.max).toBeGreaterThan(5);
  });

  it('gives an empty series and an all-zero series a unit domain', () => {
    expect(extentOf([])).toEqual({ min: 0, max: 1 });
    expect(extentOf([0, 0])).toEqual({ min: 0, max: 1 });
  });

  it('ignores a value that is not finite rather than collapsing the whole axis', () => {
    expect(extentOf([2, Number.NaN, 8, Infinity])).toEqual({ min: 2, max: 8 });
  });

  it('unions two extents', () => {
    expect(unionExtent({ min: 1, max: 4 }, { min: -2, max: 3 })).toEqual({ min: -2, max: 4 });
  });
});

describe('scales', () => {
  it('maps the ends of the domain onto the ends of the range', () => {
    const scale = makeScale({ min: 0, max: 10 }, [100, 300]);
    expect(scale(0)).toBe(100);
    expect(scale(10)).toBe(300);
    expect(scale(5)).toBe(200);
  });

  it('runs backwards when the range does, which is how y grows upward on a screen', () => {
    const scale = makeScale({ min: 0, max: 1 }, [250, 10]);
    expect(scale(0)).toBe(250);
    expect(scale(1)).toBe(10);
  });
});

describe('ticks', () => {
  it('steps by one, two or five times a power of ten', () => {
    expect(niceTicks({ min: 0, max: 10 }, 6)).toEqual([0, 2, 4, 6, 8, 10]);
    // A quarter is not one of the three round steps, so five requested ticks become three.
    expect(niceTicks({ min: 0, max: 1 }, 5)).toEqual([0, 0.5, 1]);
    expect(niceTicks({ min: 0, max: 1 }, 6)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('prints a tenth as a tenth, not as 0.30000000000000004', () => {
    const ticks = niceTicks({ min: 0, max: 0.5 }, 6);
    for (const tick of ticks) {
      expect(String(tick).length, String(tick)).toBeLessThan(6);
    }
  });

  it('stays inside the extent it was given', () => {
    const ticks = niceTicks({ min: 3, max: 47 }, 5);
    expect(Math.min(...ticks)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...ticks)).toBeLessThanOrEqual(47);
  });

  it('returns the single value when the extent has no width', () => {
    expect(niceTicks({ min: 7, max: 7 })).toEqual([7]);
  });
});

describe('paths', () => {
  const points = [
    { x: 0, y: 10 },
    { x: 10, y: 20 },
    { x: 20, y: 5 },
  ];

  it('draws a line straight between the points', () => {
    expect(pathFor(points, 'line')).toBe('M 0 10 L 10 20 L 20 5');
  });

  it('draws a step that holds each value until the next reading', () => {
    expect(pathFor(points, 'step')).toBe('M 0 10 L 10 10 L 10 20 L 20 20 L 20 5');
  });

  it('draws nothing from nothing', () => {
    expect(pathFor([], 'line')).toBe('');
  });

  it('rounds coordinates, so the same data always produces the same markup', () => {
    const path = pathFor([{ x: 1 / 3, y: 2 / 3 }], 'line');
    expect(path).toBe('M 0.333 0.667');
  });
});

describe('the vocabulary that replaces colour', () => {
  it('hands each series a different dash pattern and a different marker', () => {
    const dashes = new Set<string>();
    const markers = new Set<string>();
    for (let index = 0; index < DASH_PATTERNS.length; index += 1) {
      const pattern = seriesPattern(index);
      dashes.add(pattern.dash);
      markers.add(pattern.marker);
    }
    expect(dashes.size).toBe(DASH_PATTERNS.length);
    expect(markers.size).toBe(MARKER_SHAPES.length);
  });

  it('wraps round rather than running out', () => {
    expect(seriesPattern(DASH_PATTERNS.length)).toEqual(seriesPattern(0));
  });

  it('starts with a solid stroke, because the first series should look ordinary', () => {
    expect(seriesPattern(0).dash).toBe('none');
  });

  it('draws every marker shape as a closed path of the size it was given', () => {
    for (const shape of MARKER_SHAPES) {
      const path = markerPath(shape, 50, 50, 8);
      expect(path.startsWith('M '), shape).toBe(true);
      expect(path.length, shape).toBeGreaterThan(8);
    }
    expect(markerPath('square', 10, 10, 4)).toBe('M 8 8 L 12 8 L 12 12 L 8 12 Z');
  });
});

describe('cumulative curves', () => {
  it('runs the totals forward', () => {
    expect(
      cumulative([
        { x: 1, y: 2 },
        { x: 2, y: 3 },
        { x: 3, y: 5 },
      ]),
    ).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 5 },
      { x: 3, y: 10 },
    ]);
  });

  it('never decreases when no value is negative', () => {
    const totals = cumulative([4, 0, 7, 1].map((y, x) => ({ x, y })));
    for (let index = 1; index < totals.length; index += 1) {
      expect((totals[index] as { y: number }).y).toBeGreaterThanOrEqual(
        (totals[index - 1] as { y: number }).y,
      );
    }
  });
});
