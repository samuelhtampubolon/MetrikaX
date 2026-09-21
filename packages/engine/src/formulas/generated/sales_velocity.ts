// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Sales_Velocity: Sales Velocity
 * Laju Penjualan
 *
 * Stratum V, phase B4, structural class C4, decision domain D6.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const sales_velocity: Relation = Object.freeze({
  formulaId: "sales_velocity",
  symbol: "Sales_Velocity",
  name: { id: "Laju Penjualan", en: "Sales Velocity" },
  inputs: Object.freeze(["opportunities", "deal_value", "win_rate", "cycle_length"]),
  output: "sales_velocity",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "(opportunities * deal_value * win_rate) / cycle_length",
  latex: "SV = \\dfrac{Opportunities \\times DealValue \\times WinRate}{CycleLength}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const opportunities = num(env, "opportunities");
    const deal_value = num(env, "deal_value");
    const win_rate = num(env, "win_rate");
    const cycle_length = num(env, "cycle_length");
    return (opportunities * deal_value * win_rate) / cycle_length;
  },
  inverses: Object.freeze({
    "opportunities": (env: Env): number => {
    const result = num(env, "sales_velocity");
    const cycle_length = num(env, "cycle_length");
    const deal_value = num(env, "deal_value");
    const win_rate = num(env, "win_rate");
      return result * cycle_length / (deal_value * win_rate);
    },
    "deal_value": (env: Env): number => {
    const result = num(env, "sales_velocity");
    const cycle_length = num(env, "cycle_length");
    const opportunities = num(env, "opportunities");
    const win_rate = num(env, "win_rate");
      return result * cycle_length / (opportunities * win_rate);
    },
    "win_rate": (env: Env): number => {
    const result = num(env, "sales_velocity");
    const cycle_length = num(env, "cycle_length");
    const opportunities = num(env, "opportunities");
    const deal_value = num(env, "deal_value");
      return result * cycle_length / (opportunities * deal_value);
    },
    "cycle_length": (env: Env): number => {
    const opportunities = num(env, "opportunities");
    const deal_value = num(env, "deal_value");
    const win_rate = num(env, "win_rate");
    const result = num(env, "sales_velocity");
      return (opportunities * deal_value * win_rate) / result;
    },
  }),
  inverseSources: Object.freeze({
    "opportunities": "result * cycle_length / (deal_value * win_rate)",
    "deal_value": "result * cycle_length / (opportunities * win_rate)",
    "win_rate": "result * cycle_length / (opportunities * deal_value)",
    "cycle_length": "(opportunities * deal_value * win_rate) / result",
  }),
  guards: buildGuards({
    formulaId: "sales_velocity",
    inputs: ["opportunities", "deal_value", "win_rate", "cycle_length"],
    denominators: ["cycle_length", "sales_velocity"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B4",
    structuralClass: "C4",
    decisionDomain: "D6",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "opportunities": 84,
    "deal_value": 18000000,
    "win_rate": 0.22,
    "cycle_length": 45,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 45,
    xpRepeat: 9,
    masteryThreshold: 3,
    badgeId: "badge_sales_velocity",
    unlocksAfterModule: 8,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
