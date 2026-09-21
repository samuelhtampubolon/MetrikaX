/**
 * P13: the one-at-a-time sensitivity module.
 *
 * The specification asks for a ranked table and a tornado plot drawn from it. The ranking is the
 * part that carries the claim, so it is the part tested here: the swings are checked against
 * arithmetic worked out by hand rather than against whatever the code happened to produce, and the
 * order is checked to be the order the plot will draw.
 */

import { describe, expect, it } from 'vitest';
import { RELATIONS, isSensitive, sensitivity, dominantFactorSentence } from '../src/index.ts';
import type { Relation } from '../src/index.ts';
import { expectRelative } from './support/assert.ts';

function relation(formulaId: string): Relation {
  const found = RELATIONS.get(formulaId);
  if (found === undefined) throw new Error(`No relation ${formulaId} in the registry.`);
  return found;
}

describe('which relations are perturbed', () => {
  it('covers exactly the structural classes the specification names', () => {
    const sensitive = [...RELATIONS.values()].filter((entry) => isSensitive(entry));
    const classes = new Set(sensitive.map((entry) => entry.structuralClass));
    expect([...classes].sort()).toEqual(['C4', 'C5', 'C6', 'C7', 'C9']);
  });

  it('leaves a bounded proportion alone, because its factors do not compound', () => {
    expect(isSensitive(relation('ctr'))).toBe(false);
  });

  it('leaves a composite result alone, because a structure has no swing', () => {
    expect(isSensitive(relation('van_westendorp'))).toBe(false);
    expect(isSensitive(relation('irr'))).toBe(false);
  });
});

describe('the swings', () => {
  // CLV = ARPU x margin / churn. Two factors sit in the numerator and one in the denominator, so
  // the arithmetic below is exact rather than approximate, and the denominator swings widest.
  const env = { arpu: 185_000, gross_margin: 0.6, churn_rate: 0.04 };
  const base = (185_000 * 0.6) / 0.04;

  it('moves each input by ten percent and holds the others fixed', () => {
    const result = sensitivity(relation('clv_simple'), env);

    expect(result.base).toBe(base);
    expect(result.perturbation).toBe(0.1);

    const arpu = result.factors.find((factor) => factor.variableId === 'arpu');
    expectRelative(arpu?.low ?? NaN, base * 0.9, 1e-12);
    expectRelative(arpu?.high ?? NaN, base * 1.1, 1e-12);
    expectRelative(arpu?.swing ?? NaN, base * 0.2, 1e-12);
    expectRelative(arpu?.swingShare ?? NaN, 0.2, 1e-12);
  });

  it('gives a denominator a negative swing, because raising it lowers the result', () => {
    const result = sensitivity(relation('clv_simple'), env);
    const churn = result.factors.find((factor) => factor.variableId === 'churn_rate');

    expectRelative(churn?.low ?? NaN, base / 0.9, 1e-12);
    expectRelative(churn?.high ?? NaN, base / 1.1, 1e-12);
    expectRelative(churn?.swing ?? NaN, base * (1 / 1.1 - 1 / 0.9), 1e-12);
  });

  it('ranks by the width of the swing and not by its sign', () => {
    const result = sensitivity(relation('clv_simple'), env);

    // 1/0.9 - 1/1.1 is 0.2020, wider than the 0.2 of either numerator factor.
    expect(result.dominant?.variableId).toBe('churn_rate');
    expect(result.dominant?.swing).toBeLessThan(0);

    const widths = result.factors.map((factor) => Math.abs(factor.swing));
    expect(widths).toEqual([...widths].sort((a, b) => b - a));
  });

  it('honours a perturbation other than ten percent', () => {
    const result = sensitivity(relation('clv_simple'), env, { perturbation: 0.25 });
    const arpu = result.factors.find((factor) => factor.variableId === 'arpu');

    expect(result.perturbation).toBe(0.25);
    expectRelative(arpu?.low ?? NaN, base * 0.75, 1e-12);
    expectRelative(arpu?.high ?? NaN, base * 1.25, 1e-12);
  });

  it('holds a vector input fixed rather than scaling it', () => {
    const result = sensitivity(relation('npv'), {
      cash_flows: [120_000_000, 180_000_000, 240_000_000, 260_000_000, 280_000_000],
      discount_rate: 0.12,
      investment_0: 480_000_000,
    });

    expect(result.factors.map((factor) => factor.variableId)).not.toContain('cash_flows');
    expect(result.factors.map((factor) => factor.variableId).sort()).toEqual([
      'discount_rate',
      'investment_0',
    ]);
  });
});

describe('what the module refuses to claim', () => {
  it('reports a share of nothing as nothing rather than as zero percent', () => {
    // Net reach of zero: every viewer the second placement reached, the first had reached already.
    // The swings are real, the share of the base is not defined, and the second is not rounded to
    // zero to make the column look complete.
    const result = sensitivity(relation('net_reach'), {
      gross_reach: 1_000_000,
      duplication: 1_000_000,
    });

    expect(result.base).toBe(0);
    expect(result.factors).toHaveLength(2);
    for (const factor of result.factors) {
      expect(factor.swingShare).toBeNull();
      expect(Math.abs(factor.swing)).toBe(200_000);
    }
  });

  it('marks a factor partial when one side of its range leaves the domain', () => {
    // A click-through rate of 0.95 cannot rise by ten percent: 1.045 is not a proportion, and the
    // engine refuses it. The factor keeps the side that computed and says the range is one sided.
    const result = sensitivity(relation('ctr'), { clicks: 95, impressions: 100 });
    const clicks = result.factors.find((factor) => factor.variableId === 'clicks');

    expect(clicks?.partial).toBe(true);
    expectRelative(clicks?.low ?? NaN, 0.855, 1e-12);
    expect(clicks?.high).toBe(result.base);
  });
});

describe('the dominant factor sentence', () => {
  const result = sensitivity(relation('clv_simple'), {
    arpu: 185_000,
    gross_margin: 0.6,
    churn_rate: 0.04,
  });
  const labelOf = (variableId: string): string => `[${variableId}]`;

  it('names the widest factor and says what to do about it', () => {
    const id = dominantFactorSentence(result, labelOf, 'id');
    expect(id).toContain('[churn_rate]');
    expect(id).toContain('Perbaiki estimasi faktor itu terlebih dahulu');

    const en = dominantFactorSentence(result, labelOf, 'en');
    expect(en).toContain('[churn_rate]');
    expect(en).toContain('Improve that estimate');
  });

  it('says plainly that there is no ranking when nothing could be moved', () => {
    const empty = { ...result, factors: [], dominant: null };
    expect(dominantFactorSentence(empty, labelOf, 'id')).toContain('tidak menghasilkan peringkat');
    expect(dominantFactorSentence(empty, labelOf, 'en')).toContain('produced no ranking');
  });

  it('carries no em dash and no en dash, in either locale', () => {
    for (const locale of ['id', 'en'] as const) {
      const sentence = dominantFactorSentence(result, labelOf, locale);
      expect(sentence).not.toMatch(/[–—]/);
    }
  });
});
