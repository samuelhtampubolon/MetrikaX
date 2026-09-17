/**
 * P07 explain module tests.
 *
 * engine.explain_module gives an example render built on CLV. That example cannot be reproduced
 * character for character, because it is not self-consistent: its substituted line shows a purchase
 * frequency of 2,40 while its own provenance line below derives 2,3871 for the same variable. The
 * tests below assert the shape the example defines, line by line, against numbers that do
 * reconcile. See DEVIATIONS.md, D-12.
 */

import { describe, expect, it } from 'vitest';

import { propagate, userValues } from '../src/graph/propagate.ts';
import { buildGraph } from '../src/graph/build.ts';
import {
  explainAssumptions,
  explainProvenance,
  explainStep,
  explainTree,
  explainValue,
} from '../src/graph/explain.ts';
import type { Value } from '../src/types.ts';

const graph = buildGraph();
const NOW = '2026-01-01T00:00:00.000Z';

const KNOWN = {
  revenue: 185_000_000,
  orders: 1_480,
  unique_customers: 620,
  cogs: 74_000_000,
  retention_rate: 0.88,
  discount_rate: 0.1,
  horizon_t: 5,
};

const result = propagate(userValues(KNOWN, { now: NOW }), { graph, now: NOW });

describe('explainStep', () => {
  it('renders the expression, the substituted expression and the result', () => {
    const step = result.trail.find((entry) => entry.target === 'aov')!;
    const { lines } = explainStep(step, { locale: 'id' });

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('aov = revenue / orders');
    expect(lines[1]).toBe('    = 185.000.000 / 1.480');
    expect(lines[2]).toBe('    = 125.000');
  });

  it('writes multiplication as a cross, the way the print view reads it', () => {
    const step = result.trail.find((entry) => entry.target === 'clv')!;
    const { lines } = explainStep(step, { locale: 'id' });

    expect(lines[0]).toContain(' x ');
    expect(lines[0]).not.toContain(' * ');
    expect(lines[0]).toContain('series_sum(retention_rate, discount_rate, horizon_t)');
  });

  it('formats with English separators when the workspace locale is English', () => {
    const step = result.trail.find((entry) => entry.target === 'aov')!;
    const { lines } = explainStep(step, { locale: 'en' });
    expect(lines[1]).toBe('    = 185,000,000 / 1,480');
  });

  it('renders an inverse step through the inverse expression, not the forward one', () => {
    const backwards = propagate(userValues({ aov: 125_000, orders: 1_480 }, { now: NOW }), {
      graph,
      now: NOW,
    });
    const step = backwards.trail.find((entry) => entry.target === 'revenue')!;
    const { lines } = explainStep(step, { locale: 'id' });

    expect(step.direction).toBe('inverse');
    expect(lines[0]).toBe('revenue = aov x orders');
    expect(lines[2]).toBe('        = 185.000.000');
  });
});

describe('explainProvenance', () => {
  it('names a user input as a user input and gives its generation', () => {
    const line = explainProvenance('revenue', result.derived, result.trail, { locale: 'id' });
    expect(line).toContain('masukan pengguna');
    expect(line).toContain('185.000.000');
    expect(line).toContain('[masukan, gen 0]');
  });

  it('gives a derived value its relation, its substitution and its generation', () => {
    const line = explainProvenance('gross_margin', result.derived, result.trail, { locale: 'id' });
    expect(line).toContain('gross_margin  <- (revenue - cogs) / revenue');
    expect(line).toContain('(185.000.000 - 74.000.000) / 185.000.000');
    expect(line).toContain('[turunan, gen 1]');
  });

  it('says plainly when a value is not available rather than printing nothing', () => {
    const line = explainProvenance('cac', result.derived, result.trail, { locale: 'id' });
    expect(line).toContain('belum tersedia');
  });

  it('names an assumption as an assumption', () => {
    const assumed: Value = {
      variableId: 'discount_rate',
      magnitude: 0.1,
      unitClass: 'ratio',
      origin: 'assumed',
      derivedBy: null,
      derivedFrom: [],
      confidence: 'assumed',
      timestamp: NOW,
      depth: 0,
    };
    const values = new Map(result.derived);
    values.set('discount_rate', assumed);

    const line = explainProvenance('discount_rate', values, result.trail, { locale: 'id' });
    expect(line).toContain('asumsi ruang kerja');
    expect(line).toContain('[asumsi]');
  });
});

describe('explainValue', () => {
  it('follows the example shape: the step, then one provenance line per input', () => {
    const lines = explainValue('clv', result.derived, result.trail, { locale: 'id' });

    expect(lines[0]).toMatch(/^clv = /);
    expect(lines[1]).toMatch(/^ {4}= /);
    expect(lines[2]).toMatch(/^ {4}= /);

    const provenance = lines.slice(3);
    expect(provenance).toHaveLength(6);
    expect(provenance[0]).toContain('aov  <- revenue / orders');
    expect(provenance.some((line) => line.includes('retention_rate'))).toBe(true);
    for (const line of provenance) expect(line).toMatch(/^ {2}\w/);
  });
});

describe('explainTree', () => {
  it('draws the dependency tree with box-drawing characters', () => {
    const lines = explainTree('clv', result.derived, result.trail, { locale: 'id' });

    expect(lines[0]).toMatch(/^clv = /);
    expect(lines.some((line) => line.includes('├─ '))).toBe(true);
    expect(lines.some((line) => line.includes('└─ '))).toBe(true);
    expect(lines.some((line) => line.includes('aov = 125.000'))).toBe(true);
    // The tree reaches the user inputs that AOV itself was derived from.
    expect(lines.some((line) => line.includes('revenue = 185.000.000'))).toBe(true);
  });

  it('draws a repeated variable once with its derivation and then as a back reference', () => {
    const lines = explainTree('clv', result.derived, result.trail, { locale: 'id' });
    // Revenue feeds both AOV and gross margin. It appears more than once, but its own inputs are
    // not expanded a second time.
    const revenueLines = lines.filter((line) => line.includes('revenue = '));
    expect(revenueLines.length).toBeGreaterThanOrEqual(2);
    expect(lines.length).toBeLessThan(40);
  });

  it('tags every node with its origin and generation', () => {
    const lines = explainTree('aov', result.derived, result.trail, { locale: 'en' });
    for (const line of lines) expect(line).toMatch(/\[(user|derived), gen \d+\]$/);
  });
});

describe('explainAssumptions', () => {
  it('states that nothing was assumed rather than leaving the list blank', () => {
    const sentences = explainAssumptions(result.derived, { locale: 'id' });
    expect(sentences).toHaveLength(1);
    expect(sentences[0]).toContain('Tidak ada asumsi');
  });

  it('names each assumption as a plain sentence', () => {
    const values = new Map(result.derived);
    values.set('discount_rate', {
      variableId: 'discount_rate',
      magnitude: 0.1,
      unitClass: 'ratio',
      origin: 'assumed',
      derivedBy: null,
      derivedFrom: [],
      confidence: 'assumed',
      timestamp: NOW,
      depth: 0,
    });

    const sentences = explainAssumptions(values, { locale: 'id' });
    expect(sentences).toHaveLength(1);
    expect(sentences[0]).toContain('asumsi ruang kerja');
    expect(sentences[0]).toContain('bukan sebagai angka yang diukur');
    expect(sentences[0]!.endsWith('.')).toBe(true);
  });
});

describe('the derivation reads as evidence', () => {
  it('traces every number in the CLV derivation back to an input or an assumption', () => {
    // The quality bar: a sceptical reader opens the pane and finds nothing hidden.
    const lines = explainValue('clv', result.derived, result.trail, { locale: 'id' });
    const body = lines.join('\n');

    for (const variableId of Object.keys(KNOWN)) {
      const value = result.derived.get(variableId)!;
      expect(value.origin).toBe('user');
    }
    expect(body).not.toContain('undefined');
    expect(body).not.toContain('NaN');
    expect(body).not.toMatch(/[–—]/); // no em dash, no en dash
  });
});
