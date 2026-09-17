/**
 * Resolution of the result slot of every formula.
 *
 * The specification leaves `output.canonical_variable_id` null for 60 of the 76 formulas, on the
 * ground that nothing else in the corpus consumes those results. Their inverse expressions
 * nevertheless refer to the result by the name `result`, and the propagation engine needs a
 * variable to write into or those 60 formulas cannot participate in the graph at all. Codegen
 * therefore synthesises one result variable per such formula, deterministically, from the
 * specification. See DEVIATIONS.md, D-01.
 */

import type { Spec, SpecFormula } from './spec.ts';
import { dimOfUnitClass, inferDim, unitClassOfDim } from './expr.ts';

/** Formulas whose forward result is not a single number. They publish nothing to the graph. */
export const COMPOSITE_RESULTS: Readonly<Record<string, string>> = Object.freeze({
  irr: 'irr_solve returns every root found together with a uniqueness flag.',
  van_westendorp: 'vw_intersection returns four price points plus the four curves.',
  qfd_technical_importance: 'matvec returns one importance score per technical characteristic.',
});

/**
 * Unit classes the dimensional inference cannot reach, or reaches with the wrong answer because
 * the corpus reads a dimensionless quotient as a physical quantity. Each entry states why.
 */
export const UNIT_CLASS_OVERRIDES: Readonly<Record<string, { unitClass: string; why: string }>> =
  Object.freeze({
    break_even_quantity: {
      unitClass: 'count',
      why: 'Fixed cost divided by unit contribution is dimensionless by algebra and a number of units in meaning.',
    },
    payback_period: {
      unitClass: 'period',
      why: 'Cost divided by a per-period cash flow is dimensionless by algebra and a count of periods in meaning.',
    },
    effective_frequency: {
      unitClass: 'ratio',
      why: 'Exposures per person, read as a frequency rather than as a count of people.',
    },
    rfm_score: {
      unitClass: 'score',
      why: 'A weighted aggregation of ordinal scores carries no physical dimension.',
    },
    weighted_screening: {
      unitClass: 'score',
      why: 'A weighted aggregation of ordinal scores carries no physical dimension.',
    },
    rice_score: {
      unitClass: 'score',
      why: 'A prioritisation index, not a currency amount and not a count.',
    },
    wsjf_score: {
      unitClass: 'score',
      why: 'A prioritisation index formed from a cost of delay over a job size.',
    },
    fmea_rpn: {
      unitClass: 'score',
      why: 'A product of three ordinal ratings.',
    },
    opportunity_score: {
      unitClass: 'score',
      why: 'An importance and satisfaction gap index on the survey scale.',
    },
    kano_better: { unitClass: 'ratio', why: 'A coefficient bounded by the response counts.' },
    kano_worse: { unitClass: 'ratio', why: 'A coefficient bounded by the response counts.' },
    nps: { unitClass: 'score', why: 'A net score on a fixed scale of -100 to 100.' },
    csat: {
      unitClass: 'percent',
      why: 'A share of satisfied respondents, scaled to a percentage by the expression itself.',
    },
    ces: { unitClass: 'score', why: 'A mean effort rating on the survey scale.' },
    sales_velocity: {
      unitClass: 'currency',
      why: 'Currency per period of sales cycle, reported as a currency amount per period.',
    },
    bass_n: { unitClass: 'count', why: 'A number of adopters in the period.' },
    bass_f: { unitClass: 'ratio', why: 'A cumulative adoption share bounded by zero and one.' },
    grp: { unitClass: 'score', why: 'Gross rating points, a rating index rather than a count.' },
    forecast_accuracy: { unitClass: 'ratio', why: 'One minus a mean absolute percentage error.' },
  });

export interface ResolvedOutput {
  readonly formulaId: string;
  /** The variable the forward direction writes into, or null for a composite result. */
  readonly variableId: string | null;
  readonly synthesised: boolean;
  readonly unitClass: string;
  readonly resultShape: 'scalar' | 'composite';
  /** The identifier the inverse expressions use for the result: the canonical id or `result`. */
  readonly inverseAlias: string;
  readonly inferenceNote: string;
}

export function resolveOutputs(spec: Spec): Map<string, ResolvedOutput> {
  const canonicalIds = new Set(spec.canonical_variables.map((variable) => variable.id));
  const unitClassById = new Map(
    spec.canonical_variables.map((variable) => [variable.id, variable.unit_class] as const),
  );
  const resolved = new Map<string, ResolvedOutput>();
  const taken = new Set(canonicalIds);

  for (const formula of spec.formula_registry) {
    const declared = formula.output.canonical_variable_id;

    if (declared !== null) {
      resolved.set(formula.id, {
        formulaId: formula.id,
        variableId: declared,
        synthesised: false,
        unitClass: unitClassById.get(declared) ?? 'ratio',
        resultShape: 'scalar',
        inverseAlias: declared,
        inferenceNote: 'declared in the specification',
      });
      continue;
    }

    if (formula.id in COMPOSITE_RESULTS) {
      resolved.set(formula.id, {
        formulaId: formula.id,
        variableId: null,
        synthesised: false,
        unitClass: 'utils',
        resultShape: 'composite',
        inverseAlias: 'result',
        inferenceNote: COMPOSITE_RESULTS[formula.id] as string,
      });
      continue;
    }

    const variableId = pickSynthesisedId(formula.id, taken);
    taken.add(variableId);
    const { unitClass, note } = inferUnitClass(formula, unitClassById);

    resolved.set(formula.id, {
      formulaId: formula.id,
      variableId,
      synthesised: true,
      unitClass,
      resultShape: 'scalar',
      inverseAlias: 'result',
      inferenceNote: note,
    });
  }

  return resolved;
}

function pickSynthesisedId(formulaId: string, taken: ReadonlySet<string>): string {
  for (const candidate of [formulaId, `${formulaId}_out`, `${formulaId}_result`]) {
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error(`Cannot synthesise a free result variable id for formula ${formulaId}`);
}

function inferUnitClass(
  formula: SpecFormula,
  unitClassById: ReadonlyMap<string, string>,
): { unitClass: string; note: string } {
  const override = UNIT_CLASS_OVERRIDES[formula.id];
  if (override) return { unitClass: override.unitClass, note: `override: ${override.why}` };

  const dim = inferDim(formula.expression.javascript, (name) => {
    const unitClass = unitClassById.get(name);
    return unitClass === undefined ? 'unknown' : dimOfUnitClass(unitClass);
  });
  const inferred = unitClassOfDim(dim);
  if (inferred !== null) {
    return { unitClass: inferred, note: `inferred from the dimensions of the expression` };
  }

  // C1 is bounded in [0, 1] by its own structural signature, so a ratio is the only reading.
  if (formula.validation.structural_class === 'C1') {
    return { unitClass: 'ratio', note: 'structural class C1 is bounded in [0, 1]' };
  }
  return { unitClass: 'score', note: 'no dimension could be inferred; recorded as a score' };
}
