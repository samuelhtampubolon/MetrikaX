/**
 * P09: calculator state.
 *
 * Zustand for application state, plain objects for the engine. Nothing in this store computes
 * anything: it holds what the user typed and what the engine last returned, so a reader can always
 * tell the two apart.
 */

import { create } from 'zustand';
import {
  RELATIONS,
  RELATION_LIST,
  VARIABLES,
  compute,
  parseNumber,
  EngineError,
  type Env,
  type FormulaResult,
  type Magnitude,
  type Relation,
} from '@metrika/engine';
import type { Locale } from '../locale/index.ts';

export type Grouping = 'stratum' | 'phase' | 'class' | 'domain' | 'alphabetical';

export interface ComputedOutcome {
  readonly kind: 'value';
  readonly result: FormulaResult;
  readonly env: Env;
}

export interface RefusedOutcome {
  readonly kind: 'refused';
  readonly messages: Readonly<Record<Locale, string>>;
}

export interface IncompleteOutcome {
  readonly kind: 'incomplete';
  readonly missing: readonly string[];
}

export type Outcome = ComputedOutcome | RefusedOutcome | IncompleteOutcome | { kind: 'idle' };

export interface CalculatorState {
  readonly locale: Locale;
  readonly highContrast: boolean;
  readonly grouping: Grouping;
  readonly search: string;
  readonly selectedId: string;
  readonly inputs: Readonly<Record<string, string>>;
  readonly outcome: Outcome;
  readonly derivationOpen: boolean;

  setLocale: (locale: Locale) => void;
  toggleContrast: () => void;
  setGrouping: (grouping: Grouping) => void;
  setSearch: (search: string) => void;
  select: (formulaId: string) => void;
  setInput: (variableId: string, raw: string) => void;
  clearInputs: () => void;
  loadWorkedExample: () => void;
  calculate: () => void;
  toggleDerivation: () => void;
}

const FIRST = (RELATION_LIST[0] as Relation).formulaId;

/**
 * Read the typed strings into an environment. A field left blank is missing, not zero: principle
 * P08 forbids filling a gap with a default and reporting the result as if it had been computed.
 */
export function readInputs(
  relation: Relation,
  inputs: Readonly<Record<string, string>>,
  locale: Locale,
): { env: Env; missing: string[] } {
  const env: Record<string, Magnitude> = {};
  const missing: string[] = [];

  for (const variableId of relation.inputs) {
    const raw = (inputs[variableId] ?? '').trim();
    if (raw === '') {
      missing.push(variableId);
      continue;
    }

    const definition = VARIABLES.get(variableId);
    if (definition?.valueKind === 'array') {
      const entries = raw
        .split(/[;\n]/)
        .map((row) => row.trim())
        .filter((row) => row !== '');
      const parsedRows = entries.map((row) =>
        row
          .split(/[,\s]+/)
          .map((cell) => parseNumber(cell, locale))
          .filter((cell): cell is number => cell !== null),
      );
      if (parsedRows.length === 0 || parsedRows.some((row) => row.length === 0)) {
        missing.push(variableId);
        continue;
      }
      env[variableId] =
        definition.unitClass === 'matrix' ? parsedRows : (parsedRows.flat() as number[]);
      continue;
    }

    const parsed = parseNumber(raw, locale);
    if (parsed === null) {
      missing.push(variableId);
      continue;
    }
    env[variableId] = parsed;
  }

  return { env, missing };
}

export const useCalculator = create<CalculatorState>((set, get) => ({
  locale: 'id',
  highContrast: false,
  grouping: 'stratum',
  search: '',
  selectedId: FIRST,
  inputs: {},
  outcome: { kind: 'idle' },
  derivationOpen: false,

  setLocale: (locale) => set({ locale }),
  toggleContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  setGrouping: (grouping) => set({ grouping }),
  setSearch: (search) => set({ search }),

  select: (formulaId) => set({ selectedId: formulaId, inputs: {}, outcome: { kind: 'idle' } }),

  setInput: (variableId, raw) =>
    set((state) => ({ inputs: { ...state.inputs, [variableId]: raw } })),

  clearInputs: () => set({ inputs: {}, outcome: { kind: 'idle' } }),

  /** Fill the fields with the worked example from the specification. */
  loadWorkedExample: () => {
    const relation = RELATIONS.get(get().selectedId);
    if (relation === undefined) return;
    const inputs: Record<string, string> = {};
    for (const [variableId, magnitude] of Object.entries(relation.workedExample)) {
      inputs[variableId] = renderExample(magnitude, get().locale);
    }
    set({ inputs, outcome: { kind: 'idle' } });
  },

  calculate: () => {
    const { selectedId, inputs, locale } = get();
    const relation = RELATIONS.get(selectedId);
    if (relation === undefined) return;

    const { env, missing } = readInputs(relation, inputs, locale);
    if (missing.length > 0) {
      set({ outcome: { kind: 'incomplete', missing } });
      return;
    }

    try {
      set({ outcome: { kind: 'value', result: compute(relation, env), env } });
    } catch (error) {
      if (error instanceof EngineError) {
        set({ outcome: { kind: 'refused', messages: error.messages } });
        return;
      }
      throw error;
    }
  },

  toggleDerivation: () => set((state) => ({ derivationOpen: !state.derivationOpen })),
}));

function renderExample(magnitude: Magnitude, locale: Locale): string {
  if (typeof magnitude === 'number') {
    return locale === 'id' ? String(magnitude).replace('.', ',') : String(magnitude);
  }
  const rows = magnitude as readonly unknown[];
  if (rows.length > 0 && Array.isArray(rows[0])) {
    return (rows as readonly (readonly number[])[])
      .map((row) => row.join(locale === 'id' ? ' ' : ', '))
      .join('; ');
  }
  return (rows as readonly number[]).join(locale === 'id' ? ' ' : ', ');
}
