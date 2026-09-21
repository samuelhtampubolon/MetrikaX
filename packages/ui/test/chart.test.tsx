/**
 * P14: the chart vocabulary as a component.
 *
 * These cover what the vocabulary promises: each shape draws the elements it says it draws, series
 * are told apart without colour, and the rules in design_system.chart_rules hold for any caller
 * rather than only for the two plots that happen to exist today.
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { Chart, cumulative } from '../src/index.ts';

const POINTS = [
  { x: 0, y: 4 },
  { x: 1, y: 9 },
  { x: 2, y: 6 },
  { x: 3, y: 12 },
];

function draw(
  series: Parameters<typeof Chart>[0]['series'],
  extra: Partial<Parameters<typeof Chart>[0]> = {},
): SVGElement {
  const { container } = render(
    <Chart
      label="Grafik uji"
      series={series}
      xAxisLabel="Waktu (periode)"
      yAxisLabel="Jumlah (unit)"
      formatX={(value) => String(value)}
      formatY={(value) => String(value)}
      {...extra}
    />,
  );
  return container.querySelector('svg.mk-chart') as SVGElement;
}

describe('the shapes', () => {
  it('draws a line as one path through the points', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS }]);
    const paths = svg.querySelectorAll('g.mk-chart__series path.mk-chart__line');
    expect(paths).toHaveLength(1);
    expect((paths[0] as SVGPathElement).getAttribute('d')?.split('L')).toHaveLength(4);
  });

  it('draws a step as a path that holds each value until the next reading', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS, shape: 'step' }]);
    const path = svg.querySelector('g.mk-chart__series path.mk-chart__line');
    // Three joins become six segments once each value is held.
    expect(path?.getAttribute('d')?.split('L')).toHaveLength(7);
  });

  it('draws a scatter as markers and no stroke at all', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS, shape: 'scatter' }]);
    expect(svg.querySelectorAll('g.mk-chart__series path.mk-chart__line')).toHaveLength(0);
    expect(svg.querySelectorAll('g.mk-chart__series path.mk-chart__marker')).toHaveLength(4);
  });

  it('draws bars as hatched rectangles standing on the baseline', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS, shape: 'bar' }]);
    const bars = [...svg.querySelectorAll('rect.mk-chart__bar')];
    expect(bars).toHaveLength(4);
    for (const bar of bars) {
      expect(bar.getAttribute('fill')).toBe('url(#mk-chart-hatch)');
      expect(Number(bar.getAttribute('height'))).toBeGreaterThan(0);
    }
    // The tallest reading gives the tallest bar.
    const heights = bars.map((bar) => Number(bar.getAttribute('height')));
    expect(heights.indexOf(Math.max(...heights))).toBe(3);
  });

  it('draws a cumulative curve from the running totals of a series', () => {
    const totals = cumulative(POINTS);
    expect(totals.map((point) => point.y)).toEqual([4, 13, 19, 31]);
    const svg = draw([{ id: 'a', label: 'Kumulatif', points: totals }]);
    expect(svg.querySelector('g.mk-chart__series path.mk-chart__line')).not.toBeNull();
  });
});

describe('telling series apart without colour', () => {
  it('gives each series its own dash pattern', () => {
    const svg = draw([
      { id: 'a', label: 'A', points: POINTS },
      { id: 'b', label: 'B', points: POINTS },
      { id: 'c', label: 'C', points: POINTS },
    ]);
    const dashes = [...svg.querySelectorAll('g.mk-chart__series path.mk-chart__line')].map((path) =>
      path.getAttribute('stroke-dasharray'),
    );
    expect(new Set(dashes).size).toBe(3);
  });

  it('names every series in a legend, with the same dash and marker it was drawn with', () => {
    const svg = draw([
      { id: 'a', label: 'Pertama', points: POINTS },
      { id: 'b', label: 'Kedua', points: POINTS },
    ]);
    const legend = [...svg.querySelectorAll('g.mk-chart__legend')];
    expect(legend).toHaveLength(2);
    expect(legend.map((entry) => entry.querySelector('text')?.textContent)).toEqual([
      'Pertama',
      'Kedua',
    ]);

    const drawn = [...svg.querySelectorAll('g.mk-chart__series path.mk-chart__line')].map((path) =>
      path.getAttribute('stroke-dasharray'),
    );
    const sampled = legend.map((entry) =>
      entry.querySelector('line')?.getAttribute('stroke-dasharray'),
    );
    expect(sampled).toEqual(drawn);
  });

  it('leaves the legend out when there is only one series to name', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS }]);
    expect(svg.querySelectorAll('g.mk-chart__legend')).toHaveLength(0);
  });
});

describe('the chart rules', () => {
  it('labels both axes', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS }]);
    const labels = [...svg.querySelectorAll('text.mk-chart__axislabel')].map((n) => n.textContent);
    expect(labels).toEqual(expect.arrayContaining(['Waktu (periode)', 'Jumlah (unit)']));
  });

  it('draws gridlines, or none at all when the caller says none', () => {
    expect(
      draw([{ id: 'a', label: 'A', points: POINTS }]).querySelectorAll('line.mk-chart__grid')
        .length,
    ).toBeGreaterThan(0);
    expect(
      draw([{ id: 'a', label: 'A', points: POINTS }], { gridlines: false }).querySelectorAll(
        'line.mk-chart__grid',
      ),
    ).toHaveLength(0);
  });

  it('hatches the projected region and draws it in a lighter stroke', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS, extrapolatedFrom: 1 }]);
    const hatch = svg.querySelector('rect.mk-chart__extrapolated');
    expect(hatch?.getAttribute('fill')).toBe('url(#mk-chart-hatch)');
    expect(svg.querySelectorAll('path.mk-chart__line--projected')).toHaveLength(1);
  });

  it('joins the reading to the projection, so the curve has no gap at the boundary', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS, extrapolatedFrom: 1 }]);
    const observed = svg.querySelector('path.mk-chart__line:not(.mk-chart__line--projected)');
    const projected = svg.querySelector('path.mk-chart__line--projected');
    const lastOfObserved = (observed?.getAttribute('d') ?? '').split('L').pop()?.trim();
    const firstOfProjected = (projected?.getAttribute('d') ?? '').slice(2).split('L')[0]?.trim();
    expect(firstOfProjected).toBe(lastOfObserved);
  });

  it('carries an accessible name, and no tooltip that hides a value until hover', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS }]);
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Grafik uji');
    expect(svg.querySelectorAll('title')).toHaveLength(0);
  });

  it('prints a mark with the string the caller gave it, rather than formatting the value again', () => {
    const svg = draw([{ id: 'a', label: 'A', points: POINTS }], {
      marks: [{ id: 'opp', x: 2, y: 6, label: 'OPP 78.000' }],
    });
    expect(svg.querySelector('g.mk-chart__mark text')?.textContent).toBe('OPP 78.000');
  });

  it('draws an empty series without throwing, and without inventing an axis', () => {
    const svg = draw([{ id: 'a', label: 'A', points: [] }]);
    expect(svg.querySelectorAll('g.mk-chart__series path')).toHaveLength(0);
  });
});
