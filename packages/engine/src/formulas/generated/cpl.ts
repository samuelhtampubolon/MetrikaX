// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CPL: Cost per Lead
 * Biaya per Prospek
 *
 * Stratum I, phase B3, structural class C2, decision domain D3.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const cpl: Relation = Object.freeze({
  formulaId: "cpl",
  symbol: "CPL",
  name: { id: "Biaya per Prospek", en: "Cost per Lead" },
  inputs: Object.freeze(["spend", "leads"]),
  output: "cpl",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "spend / leads",
  latex: "CPL = \\dfrac{Spend}{Leads}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const spend = num(env, "spend");
    const leads = num(env, "leads");
    return spend / leads;
  },
  inverses: Object.freeze({
    "spend": (env: Env): number => {
    const result = num(env, "cpl");
    const leads = num(env, "leads");
      return result * leads;
    },
    "leads": (env: Env): number => {
    const spend = num(env, "spend");
    const result = num(env, "cpl");
      return spend / result;
    },
  }),
  inverseSources: Object.freeze({
    "spend": "result * leads",
    "leads": "spend / result",
  }),
  guards: buildGuards({
    formulaId: "cpl",
    inputs: ["spend", "leads"],
    denominators: ["cpl", "leads"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B3",
    structuralClass: "C2",
    decisionDomain: "D3",
    computeLayer: "L1",
    curriculumModule: 2,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "spend": 24000000,
    "leads": 960,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 10,
    xpRepeat: 2,
    masteryThreshold: 4,
    badgeId: "badge_cpl",
    unlocksAfterModule: 1,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
