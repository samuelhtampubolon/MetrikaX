// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * WTP: Willingness to Pay
 * Kesediaan Membayar
 *
 * Stratum VIII, phase B1, structural class C2, decision domain D2.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const wtp: Relation = Object.freeze({
  formulaId: "wtp",
  symbol: "WTP",
  name: { id: "Kesediaan Membayar", en: "Willingness to Pay" },
  inputs: Object.freeze(["delta_u", "beta_price"]),
  output: "wtp",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "delta_u / Math.abs(beta_price)",
  latex: "WTP = \\dfrac{\\Delta U}{|\\beta_{price}|}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const delta_u = num(env, "delta_u");
    const beta_price = num(env, "beta_price");
    return delta_u / Math.abs(beta_price);
  },
  inverses: Object.freeze({
    "delta_u": (env: Env): number => {
    const result = num(env, "wtp");
    const beta_price = num(env, "beta_price");
      return result * Math.abs(beta_price);
    },
    "beta_price": (env: Env): number => {
    const delta_u = num(env, "delta_u");
    const result = num(env, "wtp");
      return delta_u / result;
    },
  }),
  inverseSources: Object.freeze({
    "delta_u": "result * Math.abs(beta_price)",
    "beta_price": "delta_u / result",
  }),
  guards: buildGuards({
    formulaId: "wtp",
    inputs: ["delta_u", "beta_price"],
    denominators: ["wtp"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "VIII",
    phase: "B1",
    structuralClass: "C2",
    decisionDomain: "D2",
    computeLayer: "L2",
    curriculumModule: 8,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "delta_u": 0.55,
    "beta_price": -0.000012,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 70,
    xpRepeat: 14,
    masteryThreshold: 3,
    badgeId: "badge_wtp",
    unlocksAfterModule: 7,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
