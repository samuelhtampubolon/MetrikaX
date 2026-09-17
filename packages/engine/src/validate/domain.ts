/**
 * P04: domain validation driven by each formula's structural class engine_rule.
 *
 * Two kinds of check live here. Guards run before a relation is evaluated and can block it.
 * Result checks run after and reject a value that left the domain its structural class defines.
 * Neither ever returns Infinity or NaN: both raise a named DomainViolation with a message in both
 * locales, which is what principle P08 requires.
 */

import { DomainViolation } from '../errors.ts';
import type { Env, Guard, GuardResult, Magnitude, Relation } from '../types.ts';
import { VARIABLES } from '../variables/generated/registry.ts';

const OK: GuardResult = { ok: true };

export interface GuardSpec {
  readonly formulaId: string;
  readonly inputs: readonly string[];
  /** Identifiers that appear directly under a division bar in the expression. */
  readonly denominators: readonly string[];
  readonly guardZeroDenominator: boolean;
  readonly rejectNegativeCounts: boolean;
}

export function buildGuards(spec: GuardSpec): readonly Guard[] {
  const guards: Guard[] = [];

  if (spec.guardZeroDenominator) {
    for (const denominator of spec.denominators) {
      guards.push(zeroDenominatorGuard(denominator));
    }
  }

  if (spec.rejectNegativeCounts) {
    const counted = spec.inputs.filter((variableId) => {
      const definition = VARIABLES.get(variableId);
      return definition?.unitClass === 'count' || definition?.unitClass === 'currency';
    });
    if (counted.length > 0) guards.push(nonNegativeGuard(spec.formulaId, counted));
  }

  return Object.freeze(guards);
}

function labelOf(variableId: string): { id: string; en: string } {
  const definition = VARIABLES.get(variableId);
  return definition ? definition.label : { id: variableId, en: variableId };
}

function zeroDenominatorGuard(variableId: string): Guard {
  const label = labelOf(variableId);
  return {
    id: `zero_denominator:${variableId}`,
    describe: {
      id: `${label.id} dipakai sebagai penyebut dan tidak boleh bernilai nol.`,
      en: `${label.en} is used as a denominator and may not be zero.`,
    },
    check: (env: Env): GuardResult => {
      const magnitude = env[variableId];
      if (typeof magnitude !== 'number') return OK;
      if (magnitude === 0) return { ok: false, reason: `zero_denominator:${variableId}` };
      return OK;
    },
  };
}

function nonNegativeGuard(formulaId: string, variableIds: readonly string[]): Guard {
  return {
    id: `non_negative:${formulaId}`,
    describe: {
      id: 'Jumlah dan nilai uang pada rumus ini tidak boleh negatif.',
      en: 'The counts and money amounts in this formula may not be negative.',
    },
    check: (env: Env): GuardResult => {
      for (const variableId of variableIds) {
        const magnitude = env[variableId];
        if (typeof magnitude === 'number' && magnitude < 0) {
          return { ok: false, reason: `negative_count:${variableId}` };
        }
      }
      return OK;
    },
  };
}

export function checkGuards(relation: Relation, env: Env): GuardResult {
  for (const guard of relation.guards) {
    const outcome = guard.check(env);
    if (!outcome.ok) return outcome;
  }
  return OK;
}

/** Turn a guard reason code into a sentence in both locales. */
export function describeGuardReason(
  relation: Relation,
  reason: string,
): {
  id: string;
  en: string;
} {
  const [kind, variableId = ''] = reason.split(':');
  const label = labelOf(variableId);
  switch (kind) {
    case 'zero_denominator':
      return {
        id: `${relation.symbol} tidak dapat dihitung karena ${label.id} bernilai nol. Masukkan nilai yang lebih besar dari nol.`,
        en: `${relation.symbol} cannot be computed because ${label.en} is zero. Enter a value greater than zero.`,
      };
    case 'negative_count':
      return {
        id: `${label.id} bernilai negatif, sedangkan ${relation.symbol} memerlukan nilai nol atau lebih.`,
        en: `${label.en} is negative while ${relation.symbol} requires zero or more.`,
      };
    case 'non_finite':
      return {
        id: `${relation.symbol} menghasilkan nilai yang tidak berhingga, sehingga hasilnya tidak ditampilkan.`,
        en: `${relation.symbol} produced a non-finite value, so no result is shown.`,
      };
    case 'period_mismatch':
      return {
        id: `${relation.symbol} menggabungkan nilai dengan periode yang berbeda.`,
        en: `${relation.symbol} combines values stamped with different periods.`,
      };
    default:
      return {
        id: `${relation.symbol} terhalang: ${reason}.`,
        en: `${relation.symbol} is blocked: ${reason}.`,
      };
  }
}

/**
 * The C1 range assertion and the finiteness check. A C1 relation whose result leaves [0, 1] has
 * been fed a denominator that is not the true parent set of its numerator, and the diagnostic says
 * exactly that rather than printing the number.
 */
export function checkResult(relation: Relation, magnitude: Magnitude): void {
  if (typeof magnitude !== 'number') return;

  if (!Number.isFinite(magnitude)) {
    throw new DomainViolation(
      {
        id: `${relation.symbol} menghasilkan nilai yang tidak berhingga. Periksa kembali masukannya.`,
        en: `${relation.symbol} produced a non-finite value. Check the inputs.`,
      },
      { formulaId: relation.formulaId, code: 'non_finite' },
    );
  }

  const bounds = relation.resultBounds;
  if (bounds !== null && !(magnitude >= bounds.lower && magnitude <= bounds.upper)) {
    throw new DomainViolation(
      {
        id:
          `${relation.symbol} menghasilkan ${magnitude}, di luar rentang ${bounds.lower} sampai ` +
          `${bounds.upper} yang diwajibkan kelas struktur ${relation.structuralClass}. Penyebut ` +
          `kemungkinan bukan himpunan induk sesungguhnya dari pembilang, atau kedua besaran ` +
          `berasal dari periode yang berbeda.`,
        en:
          `${relation.symbol} produced ${magnitude}, outside the range ${bounds.lower} to ` +
          `${bounds.upper} that structural class ${relation.structuralClass} requires. The ` +
          `denominator is probably not the true parent set of the numerator, or the two quantities ` +
          `come from different periods.`,
      },
      { formulaId: relation.formulaId, code: 'range_violation' },
    );
  }
}
