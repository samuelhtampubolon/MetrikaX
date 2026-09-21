// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * ARPPU: Average Revenue per Paying User
 * Pendapatan Rata-rata per Pengguna Berbayar
 *
 * Stratum I, phase B5, structural class C2, decision domain D2.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const arppu: Relation = Object.freeze({
  formulaId: "arppu",
  symbol: "ARPPU",
  name: { id: "Pendapatan Rata-rata per Pengguna Berbayar", en: "Average Revenue per Paying User" },
  inputs: Object.freeze(["revenue", "paying_users"]),
  output: "arppu",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "revenue / paying_users",
  latex: "ARPPU = \\dfrac{Revenue}{PayingUsers}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const revenue = num(env, "revenue");
    const paying_users = num(env, "paying_users");
    return revenue / paying_users;
  },
  inverses: Object.freeze({
    "revenue": (env: Env): number => {
    const result = num(env, "arppu");
    const paying_users = num(env, "paying_users");
      return result * paying_users;
    },
    "paying_users": (env: Env): number => {
    const revenue = num(env, "revenue");
    const result = num(env, "arppu");
      return revenue / result;
    },
  }),
  inverseSources: Object.freeze({
    "revenue": "result * paying_users",
    "paying_users": "revenue / result",
  }),
  guards: buildGuards({
    formulaId: "arppu",
    inputs: ["revenue", "paying_users"],
    denominators: ["arppu", "paying_users"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B5",
    structuralClass: "C2",
    decisionDomain: "D2",
    computeLayer: "L1",
    curriculumModule: 2,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "revenue": 185000000,
    "paying_users": 7300,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 10,
    xpRepeat: 2,
    masteryThreshold: 4,
    badgeId: "badge_arppu",
    unlocksAfterModule: 1,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
