/**
 * P14: the chart vocabulary. Line, step, scatter, bar, cumulative curve, and the marks that name a
 * point on one of them. The tornado plot keeps its own component, PlotCanvas, because its axis
 * runs the other way.
 *
 * Every rule in design_system.chart_rules is enforced by the shape of this component rather than
 * left to the caller's care. Both axis labels are required props, so a chart cannot be built
 * without naming its quantities and units. There is no colour input at all. There is no animation
 * and no tooltip: a value a reader has to hover to see is a value that is not in the printout, and
 * print is a first-class output here.
 *
 * The caller passes points that are already the numbers it shows in the adjacent table, and where
 * a number is printed on the chart it passes the printed string rather than the value, so the two
 * cannot drift apart.
 */

import type { ReactNode } from 'react';
import {
  extentOf,
  makeScale,
  markerPath,
  niceTicks,
  pathFor,
  round,
  seriesPattern,
  unionExtent,
  type Extent,
  type Point,
  type SeriesShape,
} from '../charts/geometry.ts';

export interface ChartSeries {
  readonly id: string;
  readonly label: string;
  readonly points: readonly Point[];
  /** Defaults to a line. */
  readonly shape?: SeriesShape;
  /**
   * The x value from which this series stops being a reading and starts being a projection. The
   * region to its right is hatched rather than solid, which chart_rules requires of elasticity and
   * diffusion plots, and the line over it is drawn in a lighter dash.
   */
  readonly extrapolatedFrom?: number;
}

/** A named point: the four Van Westendorp crossings, a break-even, a target. */
export interface ChartMark {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  /** Printed beside the mark. The caller passes the same string its table prints. */
  readonly label: string;
}

export interface ChartProps {
  /** The accessible name of the whole figure. */
  readonly label: string;
  readonly series: readonly ChartSeries[];
  /** The quantity and its unit. chart_rules requires both on every axis. */
  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  readonly formatX: (value: number) => string;
  readonly formatY: (value: number) => string;
  readonly marks?: readonly ChartMark[];
  /** Dotted at 25 percent opacity, or absent. Nothing else is offered. */
  readonly gridlines?: boolean;
  readonly legend?: boolean;
  readonly width?: number;
  readonly height?: number;
  readonly className?: string;
}

const MARGIN = { top: 10, right: 14, bottom: 46, left: 68 } as const;

export function Chart({
  label,
  series,
  xAxisLabel,
  yAxisLabel,
  formatX,
  formatY,
  marks = [],
  gridlines = true,
  legend = true,
  width = 460,
  height = 260,
  className,
}: ChartProps): ReactNode {
  const legendHeight = legend && series.length > 1 ? 14 * series.length + 6 : 0;
  const plotHeight = height - MARGIN.top - MARGIN.bottom - legendHeight;
  const plotWidth = width - MARGIN.left - MARGIN.right;

  const everyPoint = series.flatMap((entry) => entry.points);
  const xExtent = padBars(series, extentOf(everyPoint.map((point) => point.x)));
  const yExtent = withZero(series, extentOf(everyPoint.map((point) => point.y)));
  const markedX = marks.map((mark) => mark.x);
  const domainX = markedX.length === 0 ? xExtent : unionExtent(xExtent, extentOf(markedX));

  const scaleX = makeScale(domainX, [MARGIN.left, MARGIN.left + plotWidth]);
  const scaleY = makeScale(yExtent, [MARGIN.top + plotHeight, MARGIN.top]);
  const baseline = MARGIN.top + plotHeight;

  const xTicks = niceTicks(domainX, 6);
  const yTicks = niceTicks(yExtent, 6);

  return (
    <svg
      className={className === undefined ? 'mk-chart' : `mk-chart ${className}`}
      role="img"
      aria-label={label}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <pattern
          id="mk-chart-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="#000000" strokeWidth="1" />
        </pattern>
      </defs>

      {/* The projected regions sit behind everything, hatched rather than filled. */}
      {series.map((entry) =>
        entry.extrapolatedFrom === undefined ? null : (
          <rect
            key={`hatch-${entry.id}`}
            className="mk-chart__extrapolated"
            x={round(scaleX(entry.extrapolatedFrom))}
            y={MARGIN.top}
            width={round(Math.max(0, MARGIN.left + plotWidth - scaleX(entry.extrapolatedFrom)))}
            height={round(plotHeight)}
            fill="url(#mk-chart-hatch)"
          />
        ),
      )}

      {gridlines
        ? [
            ...yTicks.map((tick) => (
              <line
                key={`gy-${tick}`}
                className="mk-chart__grid"
                x1={MARGIN.left}
                y1={round(scaleY(tick))}
                x2={round(MARGIN.left + plotWidth)}
                y2={round(scaleY(tick))}
              />
            )),
            ...xTicks.map((tick) => (
              <line
                key={`gx-${tick}`}
                className="mk-chart__grid"
                x1={round(scaleX(tick))}
                y1={MARGIN.top}
                x2={round(scaleX(tick))}
                y2={round(baseline)}
              />
            )),
          ]
        : null}

      {series.map((entry, index) => (
        <Series
          key={entry.id}
          entry={entry}
          index={index}
          scaleX={scaleX}
          scaleY={scaleY}
          baseline={baseline}
          plotWidth={plotWidth}
        />
      ))}

      {marks.map((mark) => (
        <g key={mark.id} className="mk-chart__mark">
          <path
            className="mk-chart__marker"
            d={markerPath('plus', scaleX(mark.x), scaleY(mark.y), 9)}
          />
          <text x={round(scaleX(mark.x)) + 6} y={round(scaleY(mark.y)) - 5}>
            {mark.label}
          </text>
        </g>
      ))}

      {/* Axes last, so no series draws over them. */}
      <line
        className="mk-chart__axis"
        x1={MARGIN.left}
        y1={MARGIN.top}
        x2={MARGIN.left}
        y2={round(baseline)}
      />
      <line
        className="mk-chart__axis"
        x1={MARGIN.left}
        y1={round(baseline)}
        x2={round(MARGIN.left + plotWidth)}
        y2={round(baseline)}
      />

      {yTicks.map((tick) => (
        <g key={`ty-${tick}`}>
          <line
            className="mk-chart__tick"
            x1={MARGIN.left - 4}
            y1={round(scaleY(tick))}
            x2={MARGIN.left}
            y2={round(scaleY(tick))}
          />
          <text
            className="mk-chart__ticklabel"
            x={MARGIN.left - 7}
            y={round(scaleY(tick)) + 3}
            textAnchor="end"
          >
            {formatY(tick)}
          </text>
        </g>
      ))}

      {xTicks.map((tick) => (
        <g key={`tx-${tick}`}>
          <line
            className="mk-chart__tick"
            x1={round(scaleX(tick))}
            y1={round(baseline)}
            x2={round(scaleX(tick))}
            y2={round(baseline) + 4}
          />
          <text
            className="mk-chart__ticklabel"
            x={round(scaleX(tick))}
            y={round(baseline) + 15}
            textAnchor="middle"
          >
            {formatX(tick)}
          </text>
        </g>
      ))}

      <text
        className="mk-chart__axislabel"
        x={round(MARGIN.left + plotWidth / 2)}
        y={round(baseline) + 30}
        textAnchor="middle"
      >
        {xAxisLabel}
      </text>
      <text
        className="mk-chart__axislabel"
        transform={`translate(12 ${round(MARGIN.top + plotHeight / 2)}) rotate(-90)`}
        textAnchor="middle"
      >
        {yAxisLabel}
      </text>

      {legendHeight === 0
        ? null
        : series.map((entry, index) => {
            const pattern = seriesPattern(index);
            const y = height - legendHeight + 10 + index * 14;
            return (
              <g key={`legend-${entry.id}`} className="mk-chart__legend">
                <line
                  className="mk-chart__line"
                  x1={MARGIN.left}
                  y1={y}
                  x2={MARGIN.left + 28}
                  y2={y}
                  strokeDasharray={pattern.dash}
                />
                <path
                  className="mk-chart__marker"
                  d={markerPath(pattern.marker, MARGIN.left + 14, y, 6)}
                />
                <text x={MARGIN.left + 36} y={y + 3}>
                  {entry.label}
                </text>
              </g>
            );
          })}
    </svg>
  );
}

function Series({
  entry,
  index,
  scaleX,
  scaleY,
  baseline,
  plotWidth,
}: {
  entry: ChartSeries;
  index: number;
  scaleX: (value: number) => number;
  scaleY: (value: number) => number;
  baseline: number;
  plotWidth: number;
}): ReactNode {
  const pattern = seriesPattern(index);
  const shape = entry.shape ?? 'line';
  const projected = entry.points.map((point) => ({ x: scaleX(point.x), y: scaleY(point.y) }));

  if (shape === 'bar') {
    const slot = entry.points.length < 2 ? plotWidth / 2 : plotWidth / entry.points.length;
    const barWidth = Math.max(2, slot * 0.6);
    return (
      <g className="mk-chart__series" data-series={entry.id}>
        {projected.map((point, pointIndex) => (
          <rect
            key={`${entry.id}-${pointIndex}`}
            className="mk-chart__bar"
            x={round(point.x - barWidth / 2)}
            y={round(Math.min(point.y, baseline))}
            width={round(barWidth)}
            height={round(Math.abs(baseline - point.y))}
            fill="url(#mk-chart-hatch)"
          />
        ))}
      </g>
    );
  }

  if (shape === 'scatter') {
    return (
      <g className="mk-chart__series" data-series={entry.id}>
        {projected.map((point, pointIndex) => (
          <path
            key={`${entry.id}-${pointIndex}`}
            className="mk-chart__marker"
            d={markerPath(pattern.marker, point.x, point.y, 7)}
          />
        ))}
      </g>
    );
  }

  // A projection is drawn separately from the readings, and the two share the point at which they
  // meet so the line has no gap in it.
  const cut =
    entry.extrapolatedFrom === undefined
      ? entry.points.length
      : entry.points.findIndex((point) => point.x > entry.extrapolatedFrom!);
  const split = cut === -1 ? entry.points.length : cut;
  const observed = projected.slice(0, split);
  const forecast = split >= projected.length ? [] : projected.slice(Math.max(0, split - 1));

  return (
    <g className="mk-chart__series" data-series={entry.id}>
      {observed.length > 0 ? (
        <path
          className="mk-chart__line"
          d={pathFor(observed, shape === 'step' ? 'step' : 'line')}
          strokeDasharray={pattern.dash}
        />
      ) : null}
      {forecast.length > 0 ? (
        <path
          className="mk-chart__line mk-chart__line--projected"
          d={pathFor(forecast, shape === 'step' ? 'step' : 'line')}
          strokeDasharray="2 3"
        />
      ) : null}
      {entry.points.length <= 24
        ? projected.map((point, pointIndex) => (
            <path
              key={`${entry.id}-m-${pointIndex}`}
              className="mk-chart__marker"
              d={markerPath(pattern.marker, point.x, point.y, 6)}
            />
          ))
        : null}
    </g>
  );
}

/** A bar chart needs half a slot of air at each end, or the outer bars are cut in half. */
function padBars(series: readonly ChartSeries[], extent: Extent): Extent {
  if (!series.some((entry) => entry.shape === 'bar')) return extent;
  const count = Math.max(...series.map((entry) => entry.points.length), 1);
  const slot = (extent.max - extent.min) / Math.max(1, count - 1);
  return { min: extent.min - slot / 2, max: extent.max + slot / 2 };
}

/** Bars are read against zero, so a bar chart's y axis always includes it. */
function withZero(series: readonly ChartSeries[], extent: Extent): Extent {
  if (!series.some((entry) => entry.shape === 'bar')) return extent;
  return { min: Math.min(0, extent.min), max: Math.max(0, extent.max) };
}
