// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';
import { series_sum } from '../../helpers/index.ts';

/**
 * CLV: Customer Lifetime Value with Horizon
 * Nilai Seumur Hidup Pelanggan Berhorizon
 *
 * Stratum V, phase B6, structural class C6, decision domain D5.
 * Engine rule: discount_rate and horizon are mandatory output annotations, never optional
 */
export const clv: Relation = Object.freeze({
  formulaId: "clv",
  symbol: "CLV",
  name: { id: "Nilai Seumur Hidup Pelanggan Berhorizon", en: "Customer Lifetime Value with Horizon" },
  inputs: Object.freeze(["aov", "purchase_frequency", "gross_margin", "retention_rate", "discount_rate", "horizon_t"]),
  output: "clv",
  structuralClass: "C6",
  resultBounds: null,
  expressionSource: "aov * purchase_frequency * gross_margin * series_sum(retention_rate, discount_rate, horizon_t)",
  latex: "CLV = AOV \\times F \\times GM \\times \\sum_{t=1}^{T} \\dfrac{RetentionRate^{t}}{(1 + DiscountRate)^{t}}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const aov = num(env, "aov");
    const purchase_frequency = num(env, "purchase_frequency");
    const gross_margin = num(env, "gross_margin");
    const retention_rate = num(env, "retention_rate");
    const discount_rate = num(env, "discount_rate");
    const horizon_t = num(env, "horizon_t");
    return aov * purchase_frequency * gross_margin * series_sum(retention_rate, discount_rate, horizon_t);
  },
  inverses: Object.freeze({
    "aov": (env: Env): number => {
    const clv = num(env, "clv");
    const purchase_frequency = num(env, "purchase_frequency");
    const gross_margin = num(env, "gross_margin");
    const retention_rate = num(env, "retention_rate");
    const discount_rate = num(env, "discount_rate");
    const horizon_t = num(env, "horizon_t");
      return clv / (purchase_frequency * gross_margin * series_sum(retention_rate, discount_rate, horizon_t));
    },
    "gross_margin": (env: Env): number => {
    const clv = num(env, "clv");
    const aov = num(env, "aov");
    const purchase_frequency = num(env, "purchase_frequency");
    const retention_rate = num(env, "retention_rate");
    const discount_rate = num(env, "discount_rate");
    const horizon_t = num(env, "horizon_t");
      return clv / (aov * purchase_frequency * series_sum(retention_rate, discount_rate, horizon_t));
    },
    "purchase_frequency": (env: Env): number => {
    const clv = num(env, "clv");
    const aov = num(env, "aov");
    const gross_margin = num(env, "gross_margin");
    const retention_rate = num(env, "retention_rate");
    const discount_rate = num(env, "discount_rate");
    const horizon_t = num(env, "horizon_t");
      return clv / (aov * gross_margin * series_sum(retention_rate, discount_rate, horizon_t));
    },
  }),
  inverseSources: Object.freeze({
    "aov": "clv / (purchase_frequency * gross_margin * series_sum(retention_rate, discount_rate, horizon_t))",
    "gross_margin": "clv / (aov * purchase_frequency * series_sum(retention_rate, discount_rate, horizon_t))",
    "purchase_frequency": "clv / (aov * gross_margin * series_sum(retention_rate, discount_rate, horizon_t))",
  }),
  guards: buildGuards({
    formulaId: "clv",
    inputs: ["aov", "purchase_frequency", "gross_margin", "retention_rate", "discount_rate", "horizon_t"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B6",
    structuralClass: "C6",
    decisionDomain: "D5",
    computeLayer: "L2",
    curriculumModule: 6,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "aov": 125000,
    "purchase_frequency": 2.4,
    "gross_margin": 0.6,
    "retention_rate": 0.88,
    "discount_rate": 0.1,
    "horizon_t": 5,
  }),
  publishesToGraph: true,
});
