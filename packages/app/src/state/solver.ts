/**
 * P12: the workbench state.
 *
 * The calculator computes one relation. The workbench runs the whole graph: it holds the values a
 * person has entered, calls the propagation engine over them, and keeps what came back, including
 * the parts that are not results. What was blocked and what disagrees matter as much as what was
 * derived, because a tool meant to produce auditable evidence has to show the gaps.
 */

import { create } from 'zustand';
import {
  analyseUnderdetermination,
  buildGraph,
  propagate,
  userValues,
  type BlockedRelation,
  type Conflict,
  type PropagationResult,
  type UnderdeterminationReport,
  type Value,
} from '@metrika/engine';
import type { Currency, Period } from '../storage/types.ts';

const GRAPH = buildGraph();

export interface SolverState {
  /** What the person typed. Keyed by variable, so a second entry replaces the first. */
  readonly entered: Readonly<Record<string, number>>;
  readonly period: Period;
  readonly currency: Currency;
  readonly result: PropagationResult | null;
  readonly report: UnderdeterminationReport | null;
  /** The conflict the person is being asked to settle, if any. */
  readonly resolving: Conflict | null;

  enter: (variableId: string, magnitude: number) => void;
  remove: (variableId: string) => void;
  clear: () => void;
  setPeriod: (period: Period) => void;
  setCurrency: (currency: Currency) => void;
  derive: () => void;
  askWhatIsMissing: (target: string) => void;
  beginResolve: (conflict: Conflict) => void;
  resolve: (choice: 'mine' | 'derived') => void;
  cancelResolve: () => void;
}

export const useSolver = create<SolverState>((set, get) => ({
  entered: {},
  period: 'monthly',
  currency: 'IDR',
  result: null,
  report: null,
  resolving: null,

  enter: (variableId, magnitude) =>
    set((state) => ({ entered: { ...state.entered, [variableId]: magnitude }, report: null })),

  remove: (variableId) =>
    set((state) => {
      const entered = { ...state.entered };
      delete entered[variableId];
      // The derived set is dropped rather than kept: values derived from a variable that is gone
      // would still be sitting there looking current.
      return { entered, result: null, report: null };
    }),

  clear: () => set({ entered: {}, result: null, report: null, resolving: null }),
  setPeriod: (period) => set({ period, result: null }),
  setCurrency: (currency) => set({ currency }),

  derive: () => {
    const { entered, period } = get();
    const known = userValues(entered, { period });
    set({ result: propagate(known, { graph: GRAPH, period }), report: null });
  },

  askWhatIsMissing: (target) => {
    const { result, entered } = get();
    const known = new Set<string>(
      result === null ? Object.keys(entered) : [...result.derived.keys()],
    );
    set({ report: analyseUnderdetermination(target, known, { graph: GRAPH }) });
  },

  beginResolve: (conflict) => set({ resolving: conflict }),

  /**
   * Settle a conflict the way the specification requires: by asking.
   *
   * engine.conflict_detection says never to resolve automatically. Keeping the person's value
   * leaves everything as it was and simply stops asking about it; taking the derived value
   * replaces their entry with the computed one, which is a change they made, not one made for
   * them.
   */
  resolve: (choice) => {
    const { resolving } = get();
    if (resolving === null) return;

    if (choice === 'mine') {
      set({ resolving: null });
      return;
    }

    const magnitude = resolving.derivedMagnitude;
    if (typeof magnitude !== 'number') {
      set({ resolving: null });
      return;
    }

    set((state) => ({
      entered: { ...state.entered, [resolving.variableId]: magnitude },
      resolving: null,
      result: null,
    }));
    get().derive();
  },

  cancelResolve: () => set({ resolving: null }),
}));

/** The derived values only, without the entries the person supplied, sorted for display. */
export function derivedOnly(result: PropagationResult | null): Value[] {
  if (result === null) return [];
  return [...result.derived.values()]
    .filter((value) => value.origin === 'derived')
    .sort((a, b) => a.depth - b.depth || a.variableId.localeCompare(b.variableId));
}

/** One line per blocked relation, deduplicated by relation so the list stays readable. */
export function blockedOnce(result: PropagationResult | null): BlockedRelation[] {
  if (result === null) return [];
  const seen = new Set<string>();
  const out: BlockedRelation[] = [];
  for (const entry of result.blocked) {
    if (seen.has(entry.formulaId)) continue;
    seen.add(entry.formulaId);
    out.push(entry);
  }
  return out;
}
