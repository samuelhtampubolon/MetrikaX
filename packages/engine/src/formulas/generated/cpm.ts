// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CPM: Cost per Mille
 * Biaya per Seribu Tayangan
 *
 * Stratum I, phase B2, structural class C2, decision domain D3.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const cpm: Relation = Object.freeze({
  formulaId: "cpm",
  symbol: "CPM",
  name: { id: "Biaya per Seribu Tayangan", en: "Cost per Mille" },
  inputs: Object.freeze(["spend", "impressions"]),
  output: "cpm",
  structuralClass: "C2",
  expressionSource: "(spend / impressions) * 1000",
  latex: "CPM = \\dfrac{Spend}{Impressions} \\times 1000",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const spend = num(env, "spend");
    const impressions = num(env, "impressions");
    return (spend / impressions) * 1000;
  },
  inverses: Object.freeze({
    "spend": (env: Env): number => {
    const result = num(env, "cpm");
    const impressions = num(env, "impressions");
      return result * impressions / 1000;
    },
    "impressions": (env: Env): number => {
    const spend = num(env, "spend");
    const result = num(env, "cpm");
      return spend * 1000 / result;
    },
  }),
  inverseSources: Object.freeze({
    "spend": "result * impressions / 1000",
    "impressions": "spend * 1000 / result",
  }),
  guards: buildGuards({
    formulaId: "cpm",
    inputs: ["spend", "impressions"],
    denominators: ["cpm", "impressions"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B2",
    structuralClass: "C2",
    decisionDomain: "D3",
    computeLayer: "L1",
    curriculumModule: 2,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "spend": 24000000,
    "impressions": 3200000,
  }),
  publishesToGraph: false,
});
