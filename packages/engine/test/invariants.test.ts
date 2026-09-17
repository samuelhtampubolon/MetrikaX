/**
 * Invariant tests over the registry.
 *
 * These are the assertions that hold whatever the specification says, so they are the ones that
 * catch a specification edit that breaks a structural promise. They cover acceptance criteria
 * AC-01, AC-02, AC-03 and AC-05.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { RELATION_LIST, RELATIONS, FORMULA_COUNT } from '../src/formulas/generated/index.ts';
import {
  VARIABLES,
  VARIABLE_DEFINITIONS,
  SPEC_VARIABLE_COUNT,
} from '../src/variables/generated/registry.ts';
import { UNIT_CLASSES, isUnitClass } from '../src/variables/units.ts';

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const spec = JSON.parse(readFileSync(resolve(REPO_ROOT, 'spec/metrika.spec.json'), 'utf8')) as {
  formula_registry: {
    id: string;
    taxonomy: Record<string, unknown>;
    interpretation_bands: { lower: number; upper: number }[];
  }[];
  canonical_variables: { id: string }[];
  locale: { forbidden_words_in_all_content: string[] };
};

describe('formula registry invariants', () => {
  it('AC-01: contains exactly 76 formulas', () => {
    expect(FORMULA_COUNT).toBe(76);
    expect(RELATION_LIST).toHaveLength(76);
    expect(spec.formula_registry).toHaveLength(76);
  });

  it('no two formulas share an id', () => {
    expect(RELATIONS.size).toBe(RELATION_LIST.length);
  });

  it('AC-02: every formula has exactly four taxonomy coordinates', () => {
    for (const formula of spec.formula_registry) {
      for (const axis of ['axis_a', 'axis_b', 'axis_c', 'axis_d']) {
        expect(formula.taxonomy[axis], `${formula.id} is missing ${axis}`).toBeDefined();
      }
    }
    for (const relation of RELATION_LIST) {
      expect(relation.taxonomy.stratum, `${relation.formulaId} stratum`).toMatch(/^[IVX]+$/);
      expect(relation.taxonomy.phase, `${relation.formulaId} phase`).toMatch(/^B\d$/);
      expect(relation.taxonomy.structuralClass, `${relation.formulaId} class`).toMatch(/^C\d+$/);
      expect(relation.taxonomy.decisionDomain, `${relation.formulaId} domain`).toMatch(/^D\d$/);
    }
  });

  it('every input variable id exists in the canonical variable registry', () => {
    for (const relation of RELATION_LIST) {
      for (const variableId of relation.inputs) {
        expect(VARIABLES.has(variableId), `${relation.formulaId} input ${variableId}`).toBe(true);
      }
    }
  });

  it('every output variable id exists in the variable registry', () => {
    for (const relation of RELATION_LIST) {
      if (relation.output === null) continue;
      expect(VARIABLES.has(relation.output), `${relation.formulaId} output`).toBe(true);
    }
  });

  it('every inverse expression references only this formula inputs plus its output', () => {
    for (const relation of RELATION_LIST) {
      const allowed = new Set<string>([...relation.inputs]);
      if (relation.output !== null) allowed.add(relation.output);
      allowed.add('result');

      for (const [target, source] of Object.entries(relation.inverseSources)) {
        expect(allowed.has(target), `${relation.formulaId} solves for ${target}`).toBe(true);
        const identifiers = source.match(/\b[A-Za-z_][A-Za-z_0-9]*\b/g) ?? [];
        for (const identifier of identifiers) {
          if (KNOWN_NON_VARIABLES.has(identifier)) continue;
          expect(
            allowed.has(identifier),
            `${relation.formulaId} inverse for ${target} refers to ${identifier}`,
          ).toBe(true);
        }
      }
    }
  });

  it('a relation that publishes to the graph names the variable it publishes', () => {
    for (const relation of RELATION_LIST) {
      if (!relation.publishesToGraph) continue;
      expect(relation.output, `${relation.formulaId} publishes`).not.toBeNull();
    }
  });

  it('interpretation bands are contiguous and do not overlap', () => {
    for (const relation of RELATION_LIST) {
      const bands = relation.interpretationBands;
      if (bands.length === 0) continue;
      for (let index = 1; index < bands.length; index += 1) {
        const previous = bands[index - 1]!;
        const current = bands[index]!;
        expect(previous.upper, `${relation.formulaId} band ${index}`).toBeLessThanOrEqual(
          previous.upper,
        );
        expect(current.lower, `${relation.formulaId} band ${index} is contiguous`).toBe(
          previous.upper,
        );
        expect(current.upper, `${relation.formulaId} band ${index} rises`).toBeGreaterThan(
          current.lower,
        );
      }
    }
  });

  it('a C1 relation carries the bounded-proportion range assertion', () => {
    for (const relation of RELATION_LIST) {
      if (relation.structuralClass !== 'C1') continue;
      expect(relation.resultBounds, `${relation.formulaId} bounds`).not.toBeNull();
      expect(relation.resultBounds!.lower).toBe(0);
      expect([1, 100]).toContain(relation.resultBounds!.upper);
    }
  });

  it('every relation is frozen, so nothing can rewrite a formula at runtime', () => {
    for (const relation of RELATION_LIST) {
      expect(Object.isFrozen(relation), relation.formulaId).toBe(true);
    }
  });
});

describe('variable registry invariants', () => {
  it('AC-03: holds at least 150 canonical variables', () => {
    expect(SPEC_VARIABLE_COUNT).toBeGreaterThanOrEqual(150);
    expect(spec.canonical_variables.length).toBe(SPEC_VARIABLE_COUNT);
  });

  it('every variable has a unique id', () => {
    expect(VARIABLES.size).toBe(VARIABLE_DEFINITIONS.length);
  });

  it('every variable has a label in both locales and a known unit class', () => {
    for (const definition of VARIABLE_DEFINITIONS) {
      expect(definition.label.id.length, `${definition.id} Indonesian label`).toBeGreaterThan(0);
      expect(definition.label.en.length, `${definition.id} English label`).toBeGreaterThan(0);
      expect(isUnitClass(definition.unitClass), `${definition.id} unit class`).toBe(true);
    }
  });

  it('every unit class in the union is used by at least one variable', () => {
    const used = new Set(VARIABLE_DEFINITIONS.map((definition) => definition.unitClass));
    for (const unitClass of UNIT_CLASSES) {
      expect(used.has(unitClass), `unit class ${unitClass} is unused`).toBe(true);
    }
  });

  it('a synthesised variable names the formula that produces it', () => {
    for (const definition of VARIABLE_DEFINITIONS) {
      if (!definition.synthesised) continue;
      expect(definition.producedBy, `${definition.id}`).not.toBeNull();
      expect(RELATIONS.has(definition.producedBy!), `${definition.id} producer`).toBe(true);
    }
  });
});

describe('golden suite invariants', () => {
  const goldenDirectory = resolve(import.meta.dirname, 'golden');
  const files = readdirSync(goldenDirectory).filter((name) => name.endsWith('.golden.test.ts'));

  it('AC-05: one golden file per formula', () => {
    expect(files).toHaveLength(76);
    for (const relation of RELATION_LIST) {
      expect(files, relation.formulaId).toContain(`${relation.formulaId}.golden.test.ts`);
    }
  });

  it('AC-05: at least four cases per formula, including a rejection case', () => {
    let total = 0;
    for (const file of files) {
      const contents = readFileSync(resolve(goldenDirectory, file), 'utf8');
      const cases = contents.match(/\n {2}it\(/g)?.length ?? 0;
      expect(cases, `${file} case count`).toBeGreaterThanOrEqual(4);
      expect(contents, `${file} rejection case`).toMatch(/refuses|guards/);
      total += cases;
    }
    expect(total, 'total golden cases').toBeGreaterThanOrEqual(304);
  });

  it('every generated file says it is generated', () => {
    for (const file of files) {
      const contents = readFileSync(resolve(goldenDirectory, file), 'utf8');
      expect(contents.startsWith('// GENERATED FILE. DO NOT EDIT.'), file).toBe(true);
    }
  });
});

describe('content invariants', () => {
  it('AC-14: the forbidden adjectives appear nowhere in the label catalogue', () => {
    // Whole-word matching, for the reason scripts/content-lint.mjs records: the specification's
    // own axis A is the "tangga kecanggihan", which contains "canggih" without being the
    // self-congratulation the rule exists to prevent.
    const catalogue = VARIABLE_DEFINITIONS.map(
      (definition) => `${definition.label.id} ${definition.label.en} ${definition.definition}`,
    )
      .join('\n')
      .toLowerCase();
    for (const word of spec.locale.forbidden_words_in_all_content) {
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${word.toLowerCase()}(?![\\p{L}\\p{N}])`, 'u');
      expect(pattern.test(catalogue), `forbidden word: ${word}`).toBe(false);
    }
  });

  it('no engine message uses an em dash or an en dash', () => {
    // locale.register_rules_id forbids both across all output.
    const catalogue = RELATION_LIST.map(
      (relation) =>
        `${relation.name.id} ${relation.name.en} ` +
        relation.interpretationBands.map((band) => band.guidance).join(' '),
    ).join('\n');
    expect(catalogue).not.toMatch(/[–—]/);
  });
});

const KNOWN_NON_VARIABLES = new Set([
  'Math',
  'pow',
  'exp',
  'log',
  'sqrt',
  'abs',
  'min',
  'max',
  'series_sum',
  'npv_calc',
  'irr_solve',
  'black_scholes_call',
  'vw_intersection',
  'dot',
  'matvec',
  'transpose',
  'phi',
  'sum',
]);
