/**
 * P17 tests for the item generator.
 *
 * The definition of done for this phase is that each of the seven types generates a valid item for
 * every applicable formula. Applicable is the load-bearing word: inverse_solve has nothing to ask
 * of a relation with no inverse. So the counts are measured and asserted exactly, which means a
 * later change that narrows the coverage fails here rather than passing quietly.
 */

import { describe, expect, it } from 'vitest';
import {
  RELATIONS,
  RELATION_LIST,
  applicableTypes,
  buildGraph,
  compute,
  generateItem,
  grade,
  keywordsFor,
  propagate,
  userValues,
  verifyNumeric,
  XP_MULTIPLIERS,
  type AuditItem,
  type ChoiceItem,
  type ItemType,
  type Magnitude,
  type NumericItem,
  type Relation,
} from '../src/index.ts';

const TYPES = Object.keys(XP_MULTIPLIERS) as ItemType[];
const SEED = 'metrika-p17';

function generated(
  type: ItemType,
): { relation: Relation; item: NonNullable<ReturnType<typeof generateItem>> }[] {
  const out: { relation: Relation; item: NonNullable<ReturnType<typeof generateItem>> }[] = [];
  for (const relation of RELATION_LIST) {
    const item = generateItem(type, relation.formulaId, SEED);
    if (item !== null) out.push({ relation, item });
  }
  return out;
}

describe('coverage across the corpus', () => {
  it('generates the measured number of items of each type', () => {
    const counts = Object.fromEntries(TYPES.map((type) => [type, generated(type).length]));

    // Measured, not assumed. Three relations answer with a structure rather than a number and are
    // offered no numeric exercise at all; the rest of the gaps are stated beside each line.
    expect(counts).toEqual({
      forward_compute: 73,
      inverse_solve: 64,
      spot_the_error: 73,
      interpret_the_band: 42,
      choose_the_metric: 60,
      // Six. The corpus declares only eighteen places where one formula reads another's output,
      // which is the same shortfall AC-04 measures. See DEVIATIONS.md, D-11 and D-26.
      chain_derivation: 6,
      audit_the_dashboard: 73,
    });
  });

  it('offers every formula at least one kind of exercise', () => {
    const without = RELATION_LIST.filter(
      (relation) => applicableTypes(relation.formulaId, SEED).length === 0,
    );
    // The three composite relations are the exception, and they are named rather than counted.
    expect(without.map((relation) => relation.formulaId).sort()).toEqual([
      'irr',
      'qfd_technical_importance',
      'van_westendorp',
    ]);
  });

  it('never returns an item for a formula that does not exist', () => {
    for (const type of TYPES) {
      expect(generateItem(type, 'no_such_formula', SEED)).toBeNull();
    }
  });
});

describe('determinism', () => {
  it('produces the identical item from the identical seed', () => {
    for (const type of TYPES) {
      const first = generateItem(type, 'clv_simple', 'seed-a');
      const second = generateItem(type, 'clv_simple', 'seed-a');
      expect(second, type).toEqual(first);
    }
  });

  it('produces a different item from a different seed', () => {
    const differ = TYPES.filter((type) => {
      const a = generateItem(type, 'cpa', 'seed-a');
      const b = generateItem(type, 'cpa', 'seed-b');
      return a !== null && b !== null && JSON.stringify(a) !== JSON.stringify(b);
    });
    // Every type that applies to this formula varies with the seed.
    expect(differ.length).toBeGreaterThanOrEqual(4);
  });
});

describe('forward_compute', () => {
  it('states an answer the engine reproduces from the values it shows', () => {
    for (const { item } of generated('forward_compute')) {
      expect(verifyNumeric(item as NumericItem), item.formulaId).toBe(true);
    }
  });

  it('shows every input the formula reads', () => {
    for (const { relation, item } of generated('forward_compute')) {
      const shown = new Set((item as NumericItem).given.map((given) => given.variableId));
      for (const variableId of relation.inputs) {
        expect(shown.has(variableId), `${relation.formulaId}: ${variableId}`).toBe(true);
      }
    }
  });
});

describe('inverse_solve', () => {
  it('withholds exactly the value it asks for, and shows the result instead', () => {
    for (const { relation, item } of generated('inverse_solve')) {
      const numeric = item as NumericItem;
      const shown = numeric.given.map((given) => given.variableId);

      expect(shown, relation.formulaId).not.toContain(numeric.targetVariableId);
      expect(shown, relation.formulaId).toContain(relation.output);
      expect(relation.inputs, relation.formulaId).toContain(numeric.targetVariableId);
    }
  });

  it('asks only for a value the formula can actually isolate', () => {
    for (const { relation, item } of generated('inverse_solve')) {
      expect(Object.keys(relation.inverses), relation.formulaId).toContain(
        (item as NumericItem).targetVariableId,
      );
    }
  });

  it('states an answer that recomputes the result it shows', () => {
    for (const { relation, item } of generated('inverse_solve')) {
      const numeric = item as NumericItem;
      const env: Record<string, Magnitude> = { [numeric.targetVariableId]: numeric.answer };
      for (const given of numeric.given) {
        if (given.variableId !== relation.output) env[given.variableId] = given.magnitude;
      }

      const stated = numeric.given.find((given) => given.variableId === relation.output);
      const recomputed = compute(relation, env) as number;
      const expected = stated?.magnitude as number;
      expect(Math.abs((recomputed - expected) / expected), relation.formulaId).toBeLessThan(0.006);
    }
  });
});

describe('spot_the_error', () => {
  it('offers four options, one of them a failure mode of the formula in front of the learner', () => {
    for (const { relation, item } of generated('spot_the_error')) {
      const choice = item as ChoiceItem;
      expect(choice.options, relation.formulaId).toHaveLength(4);

      const correct = choice.options.find((option) => option.id === choice.correctOptionId);
      expect(correct?.ref.kind).toBe('pitfall');
      if (correct?.ref.kind === 'pitfall') {
        expect(correct.ref.formulaId).toBe(relation.formulaId);
        expect(correct.ref.index).toBeLessThan(relation.pitfallCount);
      }
    }
  });

  it('draws every distractor from a real failure mode of another formula', () => {
    for (const { relation, item } of generated('spot_the_error')) {
      const choice = item as ChoiceItem;
      for (const option of choice.options) {
        if (option.id === choice.correctOptionId) continue;
        expect(option.ref.kind).toBe('pitfall');
        if (option.ref.kind !== 'pitfall') continue;

        expect(option.ref.formulaId).not.toBe(relation.formulaId);
        const other = RELATIONS.get(option.ref.formulaId) as Relation;
        expect(option.ref.index).toBeLessThan(other.pitfallCount);
      }
    }
  });
});

describe('interpret_the_band', () => {
  it('shows a result that really falls inside the band it marks correct', () => {
    for (const { relation, item } of generated('interpret_the_band')) {
      const choice = item as ChoiceItem;
      const correct = choice.options.find((option) => option.id === choice.correctOptionId);
      expect(correct?.ref.kind).toBe('band');
      if (correct?.ref.kind !== 'band') continue;

      const band = relation.interpretationBands[correct.ref.index];
      expect(band, relation.formulaId).toBeDefined();
      expect(choice.shownResult, relation.formulaId).not.toBeNull();
      expect((choice.shownResult as number) >= (band?.lower ?? 0)).toBe(true);
      expect((choice.shownResult as number) <= (band?.upper ?? 0)).toBe(true);
    }
  });

  it('offers at least three options and never the same one twice', () => {
    for (const { relation, item } of generated('interpret_the_band')) {
      const choice = item as ChoiceItem;
      expect(choice.options.length, relation.formulaId).toBeGreaterThanOrEqual(3);
      const keys = choice.options.map((option) =>
        option.ref.kind === 'band'
          ? `${option.ref.formulaId}:${option.ref.index}`
          : option.ref.kind,
      );
      expect(new Set(keys).size, relation.formulaId).toBe(keys.length);
    }
  });
});

describe('choose_the_metric', () => {
  it('draws its distractors from the same structural class and a different decision domain', () => {
    for (const { relation, item } of generated('choose_the_metric')) {
      const choice = item as ChoiceItem;
      expect(choice.options).toHaveLength(4);

      for (const option of choice.options) {
        if (option.id === choice.correctOptionId) continue;
        const other = RELATIONS.get(option.ref.formulaId) as Relation;
        expect(other.structuralClass, relation.formulaId).toBe(relation.structuralClass);
        expect(other.taxonomy.decisionDomain, relation.formulaId).not.toBe(
          relation.taxonomy.decisionDomain,
        );
      }
    }
  });

  it('asks for a justification and knows which words would touch the question', () => {
    for (const { relation, item } of generated('choose_the_metric')) {
      const choice = item as ChoiceItem;
      expect(choice.justificationKeywords, relation.formulaId).toBeDefined();
      expect((choice.justificationKeywords ?? []).length).toBeGreaterThan(0);
    }
  });

  it('takes its keywords from the formula and its inputs, not from anywhere else', () => {
    const keywords = keywordsFor(RELATIONS.get('clv_simple') as Relation);
    expect(keywords.every((word) => word.length >= 4)).toBe(true);
    expect(keywords.some((word) => word.includes('churn') || word.includes('pelanggan'))).toBe(
      true,
    );
  });
});

describe('chain_derivation', () => {
  it('reaches its target through the propagation engine, from the values it shows', () => {
    for (const { item } of generated('chain_derivation')) {
      const numeric = item as NumericItem;
      const entered: Record<string, Magnitude> = {};
      for (const given of numeric.given) entered[given.variableId] = given.magnitude;

      const outcome = propagate(userValues(entered), { graph: buildGraph() });
      const target = outcome.derived.get(numeric.targetVariableId);

      expect(target, numeric.targetVariableId).toBeDefined();
      const magnitude = target?.magnitude as number;
      expect(Math.abs((magnitude - numeric.answer) / numeric.answer)).toBeLessThan(1e-9);
    }
  });

  it('never shows the target among the values it gives', () => {
    for (const { item } of generated('chain_derivation')) {
      const numeric = item as NumericItem;
      expect(numeric.given.map((given) => given.variableId)).not.toContain(
        numeric.targetVariableId,
      );
    }
  });

  it('reports the depth it actually reached, which this corpus limits', () => {
    const depths = generated('chain_derivation').map((entry) => (entry.item as NumericItem).depth);
    expect(depths.every((depth) => (depth ?? 0) >= 2)).toBe(true);

    // The specification asks for targets three or more relations away. Three is reached, by one
    // route, and only six formulas can be chained to at all. Measured rather than claimed, and the
    // cause is the same as AC-04: see DEVIATIONS.md, D-11 and D-26.
    expect(Math.max(...depths.map((depth) => depth ?? 0))).toBe(3);
  });
});

describe('audit_the_dashboard', () => {
  it('shows between eight and twelve rows, with exactly two of them moved', () => {
    for (const { item } of generated('audit_the_dashboard')) {
      const audit = item as AuditItem;
      expect(audit.rows.length).toBeGreaterThanOrEqual(8);
      expect(audit.rows.length).toBeLessThanOrEqual(12);
      expect(audit.corrupted).toHaveLength(2);
    }
  });

  it('moves only rows a reader can check from the other rows on the dashboard', () => {
    for (const { item } of generated('audit_the_dashboard')) {
      const audit = item as AuditItem;
      for (const variableId of audit.corrupted) {
        const row = audit.rows.find((entry) => entry.variableId === variableId);
        expect(row?.derived, variableId).toBe(true);
      }
    }
  });

  it('moves them far enough that recomputing finds them', () => {
    for (const { item } of generated('audit_the_dashboard')) {
      const audit = item as AuditItem;
      const shown = new Map(audit.rows.map((row) => [row.variableId, row.magnitude]));

      for (const variableId of audit.corrupted) {
        const row = audit.rows.find((entry) => entry.variableId === variableId);
        const relation = RELATIONS.get(row?.formulaId ?? '') as Relation;

        // Recompute the row the way a reader would: from the other rows on the same dashboard.
        const env: Record<string, Magnitude> = {};
        for (const input of relation.inputs) {
          const magnitude = shown.get(input);
          expect(magnitude, `${variableId} needs ${input} on the dashboard`).toBeDefined();
          env[input] = magnitude as number;
        }

        const honest = compute(relation, env) as number;
        const printed = row?.magnitude as number;
        expect(Math.abs((printed - honest) / honest), variableId).toBeGreaterThan(0.005);
      }
    }
  });

  it('leaves every row that is not corrupted agreeing with the rows around it', () => {
    for (const { item } of generated('audit_the_dashboard')) {
      const audit = item as AuditItem;
      const shown = new Map(audit.rows.map((row) => [row.variableId, row.magnitude]));

      for (const row of audit.rows) {
        if (!row.derived || audit.corrupted.includes(row.variableId)) continue;
        const relation = RELATIONS.get(row.formulaId ?? '') as Relation;

        const env: Record<string, Magnitude> = {};
        let complete = true;
        for (const input of relation.inputs) {
          const magnitude = shown.get(input);
          if (magnitude === undefined) complete = false;
          else env[input] = magnitude;
        }
        if (!complete) continue;

        const honest = compute(relation, env) as number;
        expect(Math.abs((row.magnitude - honest) / honest), row.variableId).toBeLessThan(1e-9);
      }
    }
  });
});

describe('grading', () => {
  const numeric = generateItem('forward_compute', 'ctr', SEED) as NumericItem;

  it('accepts an answer inside the tolerance and refuses one outside it', () => {
    expect(grade(numeric, { kind: 'numeric', value: numeric.answer }).correct).toBe(true);
    expect(grade(numeric, { kind: 'numeric', value: numeric.answer * 1.004 }).correct).toBe(true);
    expect(grade(numeric, { kind: 'numeric', value: numeric.answer * 1.02 }).correct).toBe(false);
    expect(grade(numeric, { kind: 'numeric', value: Number.NaN }).correct).toBe(false);
  });

  it('refuses a response of the wrong shape rather than guessing what was meant', () => {
    expect(grade(numeric, { kind: 'choice', optionId: 'opt0' })).toEqual({
      correct: false,
      credit: 0,
    });
  });

  it('awards the full mark for a selection alone where no justification is asked', () => {
    const choice = generateItem('spot_the_error', 'ctr', SEED) as ChoiceItem;
    expect(grade(choice, { kind: 'choice', optionId: choice.correctOptionId })).toEqual({
      correct: true,
      credit: 1,
    });
  });

  it('holds back part of the mark when the justification names nothing in the question', () => {
    const entry = generated('choose_the_metric')[0];
    const choice = entry?.item as ChoiceItem;
    const word = (choice.justificationKeywords ?? [])[0] as string;

    expect(
      grade(choice, {
        kind: 'choice',
        optionId: choice.correctOptionId,
        justification: 'begitulah',
      }).credit,
    ).toBe(0.6);
    expect(
      grade(choice, {
        kind: 'choice',
        optionId: choice.correctOptionId,
        justification: `Karena ${word} yang ditanyakan.`,
      }).credit,
    ).toBe(1);
  });

  it('awards the stated partial credit for finding one of the two, and nothing for ticking everything', () => {
    const audit = generateItem('audit_the_dashboard', 'aov', SEED) as AuditItem;

    expect(grade(audit, { kind: 'audit', variableIds: audit.corrupted }).credit).toBe(1);
    expect(
      grade(audit, { kind: 'audit', variableIds: [audit.corrupted[0] as string] }).credit,
    ).toBe(0.4);
    expect(
      grade(audit, { kind: 'audit', variableIds: audit.rows.map((row) => row.variableId) }).credit,
    ).toBe(0);
  });
});
