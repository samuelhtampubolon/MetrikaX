// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * TAM: Total Addressable Market
 * Pasar Total yang Dapat Dilayani
 *
 * Stratum VII, phase B0, structural class C4, decision domain D7.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const tam: Relation = Object.freeze({
  formulaId: "tam",
  symbol: "TAM",
  name: { id: "Pasar Total yang Dapat Dilayani", en: "Total Addressable Market" },
  inputs: Object.freeze(["population", "need_percent", "arpu"]),
  output: "tam",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "population * (need_percent / 100) * arpu",
  latex: "TAM = Population \\times NeedPercent \\times ARPU",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const population = num(env, "population");
    const need_percent = num(env, "need_percent");
    const arpu = num(env, "arpu");
    return population * (need_percent / 100) * arpu;
  },
  inverses: Object.freeze({
    "population": (env: Env): number => {
    const tam = num(env, "tam");
    const need_percent = num(env, "need_percent");
    const arpu = num(env, "arpu");
      return tam / ((need_percent / 100) * arpu);
    },
    "need_percent": (env: Env): number => {
    const tam = num(env, "tam");
    const population = num(env, "population");
    const arpu = num(env, "arpu");
      return (tam / (population * arpu)) * 100;
    },
    "arpu": (env: Env): number => {
    const tam = num(env, "tam");
    const population = num(env, "population");
    const need_percent = num(env, "need_percent");
      return tam / (population * (need_percent / 100));
    },
  }),
  inverseSources: Object.freeze({
    "population": "tam / ((need_percent / 100) * arpu)",
    "need_percent": "(tam / (population * arpu)) * 100",
    "arpu": "tam / (population * (need_percent / 100))",
  }),
  guards: buildGuards({
    formulaId: "tam",
    inputs: ["population", "need_percent", "arpu"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "VII",
    phase: "B0",
    structuralClass: "C4",
    decisionDomain: "D7",
    computeLayer: "L2",
    curriculumModule: 7,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "population": 410000,
    "need_percent": 38,
    "arpu": 1800000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 55,
    xpRepeat: 11,
    masteryThreshold: 3,
    badgeId: "badge_tam",
    unlocksAfterModule: 6,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: true,
});
