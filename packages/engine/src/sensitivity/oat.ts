/**
 * P13: one-at-a-time sensitivity.
 *
 * engine.sensitivity_module: perturb each input by plus and minus ten percent, holding the others
 * fixed, and rank the results by swing. It runs automatically for structural classes C4, C5, C6,
 * C7 and C9, which are the classes where a small optimism in each factor compounds into a large
 * optimism in the result.
 *
 * The output is one array. The tornado plot and the table beside it both read it, which is how
 * AC-15 is satisfied by construction rather than by care: there is no second computation that
 * could disagree with the first.
 */

import { compute } from '../compute.ts';
import { EngineError } from '../errors.ts';
import type { Env, Magnitude, Relation, VariableId } from '../types.ts';

/** The classes the specification names. A relation outside them is not perturbed automatically. */
export const SENSITIVE_CLASSES: ReadonlySet<string> = new Set(['C4', 'C5', 'C6', 'C7', 'C9']);

export function isSensitive(relation: Relation): boolean {
  return SENSITIVE_CLASSES.has(relation.structuralClass) && relation.resultShape === 'scalar';
}

export interface FactorSwing {
  readonly variableId: VariableId;
  /** The result when this input is ten percent below its entered value. */
  readonly low: number;
  /** The result when this input is ten percent above it. */
  readonly high: number;
  /** high minus low: how much the result moves across the range. */
  readonly swing: number;
  /** The swing as a share of the base result, or null when the base is zero. */
  readonly swingShare: number | null;
  /** True when one of the two perturbations was refused rather than computed. */
  readonly partial: boolean;
}

export interface SensitivityResult {
  readonly formulaId: string;
  readonly base: number;
  readonly perturbation: number;
  /** Ranked by swing, widest first: the tornado order. */
  readonly factors: readonly FactorSwing[];
  /** The widest factor, or null when nothing could be perturbed. */
  readonly dominant: FactorSwing | null;
}

export interface SensitivityOptions {
  /** The fraction to move each input by. The specification states ten percent. */
  readonly perturbation?: number;
}

/**
 * Run the analysis.
 *
 * A perturbation that the engine refuses, a zero denominator for instance, is not silently treated
 * as zero: that factor keeps whichever side computed and is marked partial, so the table can say
 * the range is one-sided rather than implying a swing that was never measured.
 */
export function sensitivity(
  relation: Relation,
  env: Env,
  options: SensitivityOptions = {},
): SensitivityResult {
  const perturbation = options.perturbation ?? 0.1;
  const base = compute(relation, env) as number;

  const factors: FactorSwing[] = [];

  for (const variableId of relation.inputs) {
    const magnitude = env[variableId];
    // Only a scalar can be moved by a percentage. A series or a matrix is held fixed.
    if (typeof magnitude !== 'number') continue;

    const low = evaluate(relation, env, variableId, magnitude * (1 - perturbation));
    const high = evaluate(relation, env, variableId, magnitude * (1 + perturbation));

    if (low === null && high === null) continue;

    const lowValue = low ?? base;
    const highValue = high ?? base;

    factors.push({
      variableId,
      low: lowValue,
      high: highValue,
      swing: highValue - lowValue,
      swingShare: base === 0 ? null : (highValue - lowValue) / base,
      partial: low === null || high === null,
    });
  }

  factors.sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing));

  return {
    formulaId: relation.formulaId,
    base,
    perturbation,
    factors,
    dominant: factors[0] ?? null,
  };
}

function evaluate(
  relation: Relation,
  env: Env,
  variableId: VariableId,
  magnitude: number,
): number | null {
  const perturbed: Record<VariableId, Magnitude> = { ...env, [variableId]: magnitude };
  try {
    const result = compute(relation, perturbed) as number;
    return Number.isFinite(result) ? result : null;
  } catch (error) {
    // A refusal is a real answer: this factor cannot be moved that far without leaving the domain.
    if (error instanceof EngineError) return null;
    throw error;
  }
}

/**
 * The sentence the specification asks for, naming the factor whose uncertainty costs most.
 *
 * It is deliberately an instruction rather than an observation. A ranked table tells a reader which
 * number is largest; this tells them what to do about it.
 */
export function dominantFactorSentence(
  result: SensitivityResult,
  labelOf: (variableId: VariableId) => string,
  locale: 'id' | 'en',
): string {
  if (result.dominant === null) {
    return locale === 'id'
      ? 'Tidak ada faktor yang dapat digeser, sehingga analisis sensitivitas tidak menghasilkan peringkat.'
      : 'No factor could be moved, so the sensitivity analysis produced no ranking.';
  }

  const label = labelOf(result.dominant.variableId);
  return locale === 'id'
    ? `Faktor dengan ayunan terbesar adalah ${label}. Di situlah ketidakpastian Anda paling mahal. ` +
        `Perbaiki estimasi faktor itu terlebih dahulu sebelum memperbaiki yang lain.`
    : `The factor with the widest swing is ${label}. That is where your uncertainty costs most. ` +
        `Improve that estimate before improving any other.`;
}
