// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * AOV: Average Order Value
 * Nilai Pesanan Rata-rata
 *
 * Stratum I, phase B5, structural class C2, decision domain D2.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const aov: Relation = Object.freeze({
  formulaId: "aov",
  symbol: "AOV",
  name: { id: "Nilai Pesanan Rata-rata", en: "Average Order Value" },
  inputs: Object.freeze(["revenue", "orders"]),
  output: "aov",
  structuralClass: "C2",
  expressionSource: "revenue / orders",
  latex: "AOV = \\dfrac{Revenue}{Orders}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const revenue = num(env, "revenue");
    const orders = num(env, "orders");
    return revenue / orders;
  },
  inverses: Object.freeze({
    "revenue": (env: Env): number => {
    const aov = num(env, "aov");
    const orders = num(env, "orders");
      return aov * orders;
    },
    "orders": (env: Env): number => {
    const revenue = num(env, "revenue");
    const aov = num(env, "aov");
      return revenue / aov;
    },
  }),
  inverseSources: Object.freeze({
    "revenue": "aov * orders",
    "orders": "revenue / aov",
  }),
  guards: buildGuards({
    formulaId: "aov",
    inputs: ["revenue", "orders"],
    denominators: ["aov", "orders"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
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
    "orders": 1480,
  }),
  publishesToGraph: true,
});
