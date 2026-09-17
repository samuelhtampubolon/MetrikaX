/**
 * Named engine errors.
 *
 * Principle P08, refuse rather than guess: when the inputs are insufficient or contradictory the
 * engine names the problem. It never returns Infinity, NaN or a filled-in default reported as if
 * it had been computed.
 *
 * Every error carries a `messages` record with an Indonesian and an English rendering so the
 * calling layer can present the active locale without re-deriving the reason.
 */

export type Locale = 'id' | 'en';

export type LocalisedText = Readonly<Record<Locale, string>>;

export type EngineErrorCode =
  | 'domain_violation'
  | 'zero_denominator'
  | 'negative_count'
  | 'range_violation'
  | 'period_mismatch'
  | 'naive_rate_conversion'
  | 'non_finite'
  | 'missing_input'
  | 'shape_mismatch'
  | 'no_sign_change'
  | 'conflict';

export abstract class EngineError extends Error {
  abstract readonly code: EngineErrorCode;
  readonly messages: LocalisedText;
  readonly formulaId: string | null;
  readonly variableIds: readonly string[];

  constructor(
    messages: LocalisedText,
    options: { formulaId?: string | null; variableIds?: readonly string[] } = {},
  ) {
    super(messages.en);
    this.name = new.target.name;
    this.messages = messages;
    this.formulaId = options.formulaId ?? null;
    this.variableIds = options.variableIds ?? [];
  }

  message_in(locale: Locale): string {
    return this.messages[locale];
  }
}

/** The result or an input fell outside the domain the formula's structural class permits. */
export class DomainViolation extends EngineError {
  readonly code: EngineErrorCode;

  constructor(
    messages: LocalisedText,
    options: {
      formulaId?: string | null;
      variableIds?: readonly string[];
      code?: Extract<
        EngineErrorCode,
        'domain_violation' | 'zero_denominator' | 'negative_count' | 'range_violation' | 'non_finite'
      >;
    } = {},
  ) {
    super(messages, options);
    this.code = options.code ?? 'domain_violation';
  }
}

/** A relation combined values stamped with two different periods. */
export class PeriodMismatch extends EngineError {
  readonly code = 'period_mismatch' as const;
}

/** A rate was about to be scaled by multiplication where compounding is required. */
export class NaiveRateConversion extends EngineError {
  readonly code = 'naive_rate_conversion' as const;
}

/** A helper received arguments whose shapes do not agree. */
export class ShapeMismatch extends EngineError {
  readonly code = 'shape_mismatch' as const;
}

/** A user value and a derived value disagree beyond the tolerance for the variable's unit class. */
export class ConflictError extends EngineError {
  readonly code = 'conflict' as const;
}

/** Convenience constructor for the most common guard. */
export function zeroDenominator(
  formulaId: string,
  denominatorId: string,
  denominatorLabel: LocalisedText,
): DomainViolation {
  return new DomainViolation(
    {
      id:
        `Penyebut ${denominatorLabel.id} bernilai nol, sehingga ${formulaId} tidak dapat dihitung. ` +
        `Masukkan nilai yang lebih besar dari nol.`,
      en:
        `The denominator ${denominatorLabel.en} is zero, so ${formulaId} cannot be computed. ` +
        `Enter a value greater than zero.`,
    },
    { formulaId, variableIds: [denominatorId], code: 'zero_denominator' },
  );
}
