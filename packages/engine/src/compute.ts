/**
 * The single entry point for evaluating one relation.
 *
 * Nothing outside the engine calls `relation.forward` directly. Guards run first, the expression
 * runs second, and the structural-class range assertion runs last, so a blocked relation raises a
 * named error instead of returning a number that looks like an answer.
 *
 * Bass F(t) with an innovation coefficient of zero is the case that shows why the order matters:
 * the arithmetic alone returns 0, which is finite, plausible and meaningless, because the model has
 * no adoption at all without that coefficient. The guard is what rejects it, and the guard only
 * helps if every caller passes through here.
 */

import { DomainViolation } from './errors.ts';
import { checkGuards, checkResult, describeGuardReason } from './validate/domain.ts';
import type { Env, FormulaResult, Relation } from './types.ts';

export function compute(relation: Relation, env: Env): FormulaResult {
  const guarded = checkGuards(relation, env);
  if (!guarded.ok) {
    throw new DomainViolation(describeGuardReason(relation, guarded.reason), {
      formulaId: relation.formulaId,
      code: guarded.reason.startsWith('zero_denominator')
        ? 'zero_denominator'
        : guarded.reason.startsWith('negative_count')
          ? 'negative_count'
          : 'domain_violation',
    });
  }

  const result = relation.forward(env);
  if (relation.resultShape === 'scalar') checkResult(relation, result as number);
  return result;
}

/** Solve one relation backwards for a named input. Guards apply here too. */
export function computeInverse(relation: Relation, target: string, env: Env): number {
  const inverse = relation.inverses[target];
  if (inverse === undefined) {
    throw new DomainViolation(
      {
        id: `${relation.symbol} tidak dapat diselesaikan mundur untuk ${target}.`,
        en: `${relation.symbol} cannot be solved backwards for ${target}.`,
      },
      { formulaId: relation.formulaId, variableIds: [target] },
    );
  }

  const guarded = checkGuards(relation, env);
  if (!guarded.ok) {
    throw new DomainViolation(describeGuardReason(relation, guarded.reason), {
      formulaId: relation.formulaId,
      variableIds: [target],
    });
  }

  const magnitude = inverse(env);
  if (!Number.isFinite(magnitude)) {
    throw new DomainViolation(
      {
        id: `${relation.symbol} menghasilkan nilai yang tidak berhingga saat dihitung mundur untuk ${target}.`,
        en: `${relation.symbol} produced a non-finite value while solving backwards for ${target}.`,
      },
      { formulaId: relation.formulaId, variableIds: [target], code: 'non_finite' },
    );
  }
  return magnitude;
}

/** Narrow a result that the relation declares as scalar. */
export function asScalar(relation: Relation, result: FormulaResult): number {
  if (relation.resultShape !== 'scalar' || typeof result !== 'number') {
    throw new DomainViolation(
      {
        id: `${relation.symbol} tidak menghasilkan satu angka tunggal.`,
        en: `${relation.symbol} does not produce a single number.`,
      },
      { formulaId: relation.formulaId },
    );
  }
  return result;
}
