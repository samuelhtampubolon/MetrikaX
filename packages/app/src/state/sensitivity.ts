/**
 * P13: the state behind SCR-SENSITIVITY.
 *
 * The screen offers only the relations the specification says to perturb: structural classes C4,
 * C5, C6, C7 and C9, the ones where a small optimism in each factor compounds. Offering the
 * remaining fifty-one would invite a reading the analysis does not support, since a bounded
 * proportion has no factor that can run away.
 *
 * Like every other store here, this one holds what was typed and what the engine last returned,
 * and computes nothing itself.
 */

import { create } from 'zustand';
import {
  RELATIONS,
  RELATION_LIST,
  EngineError,
  isSensitive,
  parseNumber,
  sensitivity,
  type Relation,
  type SensitivityResult,
} from '@metrika/engine';
import type { Locale } from '../locale/index.ts';
import { readInputs, useCalculator } from './calculator.ts';

/** The relations this screen will perturb, in registry order. */
export const SENSITIVE_RELATIONS: readonly Relation[] = Object.freeze(
  RELATION_LIST.filter((relation) => isSensitive(relation)),
);

const FIRST = (SENSITIVE_RELATIONS[0] as Relation).formulaId;

export type SensitivityOutcome =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'incomplete';
      readonly missing: readonly string[];
      /** True when the perturbation field itself could not be read. */
      readonly perturbationInvalid: boolean;
    }
  | { readonly kind: 'refused'; readonly messages: Readonly<Record<Locale, string>> }
  | { readonly kind: 'ranked'; readonly result: SensitivityResult };

export interface SensitivityState {
  readonly selectedId: string;
  readonly inputs: Readonly<Record<string, string>>;
  /** The perturbation as the person typed it, in percent. The specification's default is 10. */
  readonly perturbation: string;
  readonly outcome: SensitivityOutcome;

  select: (formulaId: string) => void;
  setInput: (variableId: string, raw: string) => void;
  setPerturbation: (raw: string) => void;
  clearInputs: () => void;
  loadWorkedExample: () => void;
  run: () => void;
}

/**
 * Read the perturbation field.
 *
 * A blank field, a word, a zero or a negative number is not a perturbation, so the entered text is
 * refused and the specification's ten percent is not quietly substituted: a screen that silently
 * ignored what was typed would report a range nobody asked for. Above one hundred percent the low
 * side would cross zero and change the sign of the input, which is a different question from the
 * one this analysis answers, so that is refused too.
 */
export function readPerturbation(raw: string, locale: Locale): number | null {
  const parsed = parseNumber(raw.trim(), locale);
  if (parsed === null) return null;
  if (!(parsed > 0) || parsed >= 100) return null;
  return parsed / 100;
}

export const useSensitivity = create<SensitivityState>((set, get) => ({
  selectedId: FIRST,
  inputs: {},
  perturbation: '10',
  outcome: { kind: 'idle' },

  select: (formulaId) => set({ selectedId: formulaId, inputs: {}, outcome: { kind: 'idle' } }),

  setInput: (variableId, raw) =>
    set((state) => ({ inputs: { ...state.inputs, [variableId]: raw } })),

  setPerturbation: (raw) => set({ perturbation: raw, outcome: { kind: 'idle' } }),

  clearInputs: () => set({ inputs: {}, outcome: { kind: 'idle' } }),

  loadWorkedExample: () => {
    const relation = RELATIONS.get(get().selectedId);
    if (relation === undefined) return;
    const locale = useCalculator.getState().locale;
    const inputs: Record<string, string> = {};
    for (const [variableId, magnitude] of Object.entries(relation.workedExample)) {
      inputs[variableId] = renderExample(magnitude, locale);
    }
    set({ inputs, outcome: { kind: 'idle' } });
  },

  run: () => {
    const { selectedId, inputs, perturbation } = get();
    const relation = RELATIONS.get(selectedId);
    if (relation === undefined) return;

    const locale = useCalculator.getState().locale;
    const { env, missing } = readInputs(relation, inputs, locale);
    const fraction = readPerturbation(perturbation, locale);

    if (missing.length > 0 || fraction === null) {
      // A perturbation that cannot be read is reported the same way a missing input is: by naming
      // the field, not by falling back to a number the person did not choose.
      set({ outcome: { kind: 'incomplete', missing, perturbationInvalid: fraction === null } });
      return;
    }

    try {
      const result = sensitivity(relation, env, { perturbation: fraction });
      set({ outcome: { kind: 'ranked', result } });
    } catch (error) {
      if (error instanceof EngineError) {
        set({ outcome: { kind: 'refused', messages: error.messages } });
        return;
      }
      throw error;
    }
  },
}));

/** The worked example rendered into the fields, in the active locale's decimal mark. */
function renderExample(magnitude: unknown, locale: Locale): string {
  if (typeof magnitude === 'number') {
    return locale === 'id' ? String(magnitude).replace('.', ',') : String(magnitude);
  }
  const rows = magnitude as readonly unknown[];
  if (rows.length > 0 && Array.isArray(rows[0])) {
    return (rows as readonly (readonly number[])[])
      .map((entry) => entry.join(locale === 'id' ? ' ' : ', '))
      .join('; ');
  }
  return (rows as readonly number[]).join(locale === 'id' ? ' ' : ', ');
}
