/**
 * P06 propagation tests, covering every case in testing.layers under "Propagation tests", plus
 * AC-04 and AC-11.
 */

import { describe, expect, it } from 'vitest';

import { buildGraph, requirementsFor } from '../src/graph/build.ts';
import { propagate, userValues, assertValueInvariant } from '../src/graph/propagate.ts';
import { analyseUnderdetermination } from '../src/graph/underdetermined.ts';
import { RELATION_LIST } from '../src/formulas/generated/index.ts';
import type { Value } from '../src/types.ts';

const graph = buildGraph();
const NOW = '2026-01-01T00:00:00.000Z';

function derivedIds(known: Record<string, number>, options = {}): string[] {
  const values = userValues(known, { now: NOW });
  const result = propagate(values, { graph, now: NOW, ...options });
  return [...result.derived.keys()].filter((variableId) => !(variableId in known)).sort();
}

describe('relation graph', () => {
  it('indexes every relation by the variables it reads and writes', () => {
    expect(graph.relations).toHaveLength(76);
    for (const relation of RELATION_LIST) {
      for (const input of relation.inputs) {
        expect(graph.consumers.get(input), `${relation.formulaId} consumes ${input}`).toContain(
          relation,
        );
      }
      if (relation.output !== null && relation.resultShape === 'scalar') {
        expect(graph.producers.get(relation.output)).toContain(relation);
      }
    }
  });

  it('states what a relation needs to write each variable it can write', () => {
    for (const relation of RELATION_LIST) {
      if (relation.output !== null) {
        expect(requirementsFor(relation, relation.output)).toEqual([...relation.inputs]);
      }
      for (const target of Object.keys(relation.inverses)) {
        const needed = requirementsFor(relation, target);
        expect(needed, `${relation.formulaId} -> ${target}`).not.toBeNull();
        expect(needed).not.toContain(target);
      }
    }
  });
});

describe('propagation', () => {
  it('derives AOV and ARPU from revenue, orders and users', () => {
    // The corpus reads "users" and "unique customers" as different quantities, so both are needed
    // before purchase frequency appears. Measured reach: four. See DEVIATIONS.md, D-11.
    const known = { revenue: 185_000_000, orders: 1_480, users: 9_000, unique_customers: 620 };
    const produced = derivedIds(known);

    expect(produced).toContain('aov');
    expect(produced).toContain('arpu');
    expect(produced).toContain('purchase_frequency');
    expect(produced).toEqual(['aov', 'arpu', 'purchase_frequency']);
  });

  it('chains two generations deep from the revenue cluster to lifetime value', () => {
    const known = {
      revenue: 185_000_000,
      orders: 1_480,
      users: 9_000,
      unique_customers: 620,
      cogs: 74_000_000,
      retention_rate: 0.88,
      discount_rate: 0.1,
      horizon_t: 5,
    };
    const result = propagate(userValues(known, { now: NOW }), { graph, now: NOW });

    // CLV is derived from AOV, purchase frequency and gross margin, none of which were entered.
    const clv = result.derived.get('clv');
    expect(clv).toBeDefined();
    expect(clv!.derivedFrom).toContain('aov');
    expect(clv!.derivedFrom).toContain('gross_margin');

    // Each of those is itself derived, so the chain is two relations long even though both links
    // are found inside one round. The pseudocode mutates the known set as it goes, so a relation
    // later in the round already sees what an earlier one produced, and the generation number
    // counts rounds rather than chain length.
    for (const source of ['aov', 'purchase_frequency', 'gross_margin']) {
      expect(result.derived.get(source)!.origin, source).toBe('derived');
    }
    expect(clv!.depth).toBe(1);
  });

  it('AC-04 is not met by the corpus: the measured reach from the five campaign counts is four', () => {
    const known = {
      impressions: 3_200_000,
      clicks: 40_000,
      spend: 24_000_000,
      visitors: 38_000,
      conversions: 1_140,
    };
    const produced = derivedIds(known);

    // AC-04 asks for at least twelve. The measured number is four, and the cause is the corpus
    // rather than the engine: only 18 of the 76 formulas declare any chaining at all, and the
    // relations that would extend this chain read variables the five inputs do not supply, for
    // example cost per acquisition reads "acquisitions" where the campaign counts give
    // "conversions". The exact number is asserted rather than a lower bound, so that raising the
    // reach fails this test and forces the record to be updated. See DEVIATIONS.md, D-11.
    expect(produced).toEqual(['conversion_rate', 'cpc', 'cpm', 'ctr_out']);
    expect(produced).toHaveLength(4);
  });

  it('names what a single further variable would unlock for the campaign counts', () => {
    const known = new Set(['impressions', 'clicks', 'spend', 'visitors', 'conversions']);
    for (const [target, missing] of [
      ['cpa', 'acquisitions'],
      ['cpl', 'leads'],
    ] as const) {
      const report = analyseUnderdetermination(target, known, { graph });
      expect(report.reachable).toBe(false);
      expect(report.frontiers[0]!.missing).toEqual([missing]);
    }
  });

  it('terminates inside the generation bound on a fully populated workspace', () => {
    const known: Record<string, number> = {};
    for (const relation of RELATION_LIST) {
      for (const [variableId, magnitude] of Object.entries(relation.workedExample)) {
        if (typeof magnitude === 'number' && !(variableId in known)) known[variableId] = magnitude;
      }
    }
    const result = propagate(userValues(known, { now: NOW }), { graph, now: NOW });
    expect(result.generations).toBeLessThan(12);
  });

  it('removing one known value removes exactly the transitive closure of what it produced', () => {
    const known = {
      impressions: 3_200_000,
      clicks: 40_000,
      spend: 24_000_000,
      visitors: 38_000,
      conversions: 1_140,
    };
    const withAll = new Set(derivedIds(known));

    const withoutClicks = { ...known } as Partial<typeof known>;
    delete withoutClicks.clicks;
    const withFewer = new Set(derivedIds(withoutClicks as Record<string, number>));

    // Nothing appears that was not there before: removing an input cannot add reach.
    for (const variableId of withFewer) {
      expect(withAll.has(variableId), `${variableId} appeared after removing clicks`).toBe(true);
    }
    // Everything that depended on clicks is gone.
    expect(withAll.has('ctr_out')).toBe(true);
    expect(withFewer.has('ctr_out')).toBe(false);
    expect(withFewer.has('cpc')).toBe(false);
  });

  it('records the relation, the inputs and the generation for every derived value', () => {
    const values = userValues({ revenue: 185_000_000, orders: 1_480 }, { now: NOW });
    const result = propagate(values, { graph, now: NOW });

    const aov = result.derived.get('aov');
    expect(aov).toBeDefined();
    expect(aov!.origin).toBe('derived');
    expect(aov!.derivedBy).toBe('aov');
    expect(aov!.derivedFrom).toEqual(['revenue', 'orders']);
    expect(aov!.depth).toBe(1);
    expect(aov!.magnitude).toBeCloseTo(185_000_000 / 1_480, 9);

    const step = result.trail.find((entry) => entry.target === 'aov');
    expect(step).toBeDefined();
    expect(step!.direction).toBe('forward');
    expect(step!.generation).toBe(1);
  });

  it('keeps every user value at depth zero with no derivation', () => {
    const values = userValues({ revenue: 100, orders: 4 }, { now: NOW });
    const result = propagate(values, { graph, now: NOW });
    for (const value of result.derived.values()) {
      expect(() => assertValueInvariant(value)).not.toThrow();
      if (value.origin === 'user') {
        expect(value.depth).toBe(0);
        expect(value.derivedBy).toBeNull();
      }
    }
  });

  it('solves backwards as well as forwards', () => {
    // AOV and orders are known, revenue is not: the inverse direction supplies it.
    const values = userValues({ aov: 125_000, orders: 1_480 }, { now: NOW });
    const result = propagate(values, { graph, now: NOW });

    const revenue = result.derived.get('revenue');
    expect(revenue).toBeDefined();
    expect(revenue!.magnitude).toBeCloseTo(125_000 * 1_480, 6);
    const step = result.trail.find((entry) => entry.target === 'revenue');
    expect(step!.direction).toBe('inverse');
  });
});

describe('conflict detection', () => {
  it('AC-11: never overwrites a user value and raises a Conflict instead', () => {
    // Revenue and orders imply an AOV of 125000. The user says 140000.
    const values = userValues({ revenue: 185_000_000, orders: 1_480, aov: 140_000 }, { now: NOW });
    const result = propagate(values, { graph, now: NOW });

    const stored = result.derived.get('aov') as Value;
    expect(stored.origin).toBe('user');
    expect(stored.magnitude).toBe(140_000);

    const conflict = result.conflicts.find((entry) => entry.variableId === 'aov');
    expect(conflict, 'a conflict is reported').toBeDefined();
    expect(conflict!.formulaId).toBe('aov');
    expect(conflict!.userMagnitude).toBe(140_000);
    expect(conflict!.derivedMagnitude).toBeCloseTo(125_000, 6);
    expect(conflict!.inputs).toEqual(['revenue', 'orders']);
    expect(conflict!.detail.id).toContain('tidak diubah');
    expect(conflict!.detail.en).toContain('has not been changed');
  });

  it('reports no conflict when the user value agrees inside the tolerance', () => {
    const values = userValues(
      { revenue: 185_000_000, orders: 1_480, aov: 185_000_000 / 1_480 },
      { now: NOW },
    );
    const result = propagate(values, { graph, now: NOW });
    expect(result.conflicts.filter((entry) => entry.variableId === 'aov')).toHaveLength(0);
  });
});

describe('period discipline', () => {
  it('AC-12: blocks a relation that mixes two periods and names both', () => {
    const monthly = userValues({ orders: 1_480 }, { period: 'monthly', now: NOW });
    const annual = userValues({ revenue: 2_220_000_000 }, { period: 'annual', now: NOW });
    const mixed = new Map([...monthly, ...annual]);

    const result = propagate(mixed, { graph, now: NOW });

    expect(result.derived.has('aov')).toBe(false);
    const block = result.blocked.find(
      (entry) => entry.formulaId === 'aov' && entry.reason.startsWith('period_mismatch'),
    );
    expect(block, 'the block is reported').toBeDefined();
    expect(block!.reason).toContain('annual');
    expect(block!.reason).toContain('monthly');
    expect(block!.detail.en).toContain('annual');
    expect(block!.detail.en).toContain('monthly');
    expect(block!.detail.id).toContain('tahunan');
    expect(block!.detail.id).toContain('bulanan');
  });

  it('computes normally when both values carry the same period', () => {
    const values = userValues(
      { revenue: 185_000_000, orders: 1_480 },
      { period: 'monthly', now: NOW },
    );
    const result = propagate(values, { graph, now: NOW, period: 'monthly' });
    expect(result.derived.has('aov')).toBe(true);
    expect(result.derived.get('revenue')!.period).toBe('monthly');
  });
});

describe('blocked relations', () => {
  it('names a zero denominator rather than deriving an infinite value', () => {
    const values = userValues({ revenue: 185_000_000, orders: 0 }, { now: NOW });
    const result = propagate(values, { graph, now: NOW });

    expect(result.derived.has('aov')).toBe(false);
    const block = result.blocked.find((entry) => entry.formulaId === 'aov');
    expect(block).toBeDefined();
    expect(block!.reason).toContain('zero_denominator');
    expect(block!.detail.id).toContain('nol');
  });

  it('never stores a non-finite magnitude', () => {
    const known: Record<string, number> = {};
    for (const relation of RELATION_LIST) {
      for (const [variableId, magnitude] of Object.entries(relation.workedExample)) {
        if (typeof magnitude === 'number' && !(variableId in known)) known[variableId] = magnitude;
      }
    }
    const result = propagate(userValues(known, { now: NOW }), { graph, now: NOW });
    for (const value of result.derived.values()) {
      if (typeof value.magnitude !== 'number') continue;
      expect(Number.isFinite(value.magnitude), value.variableId).toBe(true);
    }
  });
});

describe('underdetermination', () => {
  it('names what is missing instead of returning an error code', () => {
    const known = new Set(['revenue', 'orders']);
    const report = analyseUnderdetermination('clv', known, { graph });

    expect(report.reachable).toBe(false);
    expect(report.frontiers.length).toBeGreaterThan(0);
    expect(report.frontiers.length).toBeLessThanOrEqual(3);
    expect(report.message.id).toContain('Tambahkan salah satu dari');
    expect(report.message.en).toContain('Add one of');
    for (const frontier of report.frontiers) {
      expect(frontier.missing.length).toBeGreaterThan(0);
      expect(frontier.sentence.id.length).toBeGreaterThan(0);
    }
  });

  it('ranks the smallest frontier first', () => {
    const report = analyseUnderdetermination('clv', new Set(['revenue', 'orders']), { graph });
    const sizes = report.frontiers.map((frontier) => frontier.missing.length);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
  });

  it('says so plainly when the target is already available', () => {
    const report = analyseUnderdetermination('aov', new Set(['aov']), { graph });
    expect(report.reachable).toBe(true);
    expect(report.frontiers).toHaveLength(0);
    expect(report.message.id).toContain('sudah tersedia');
  });

  it('every named frontier really does unlock the target', () => {
    const known = { revenue: 185_000_000, orders: 1_480 };
    const report = analyseUnderdetermination('clv', new Set(Object.keys(known)), { graph });

    for (const frontier of report.frontiers) {
      const supplied: Record<string, number> = { ...known };
      for (const variableId of frontier.missing) supplied[variableId] = plausible(variableId);
      const produced = propagate(userValues(supplied, { now: NOW }), { graph, now: NOW });
      expect(
        produced.derived.has('clv'),
        `frontier ${frontier.missing.join(', ')} did not unlock clv`,
      ).toBe(true);
    }
  });
});

/** A value inside the domain of the variable, used to check that a frontier really unlocks. */
function plausible(variableId: string): number {
  if (variableId.includes('rate') || variableId.includes('margin')) return 0.6;
  if (variableId === 'discount_rate') return 0.1;
  if (variableId === 'horizon_t') return 5;
  if (variableId === 'purchase_frequency') return 2.4;
  return 1_000;
}
