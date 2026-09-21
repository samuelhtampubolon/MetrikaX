// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Purchase_Frequency: Purchase Frequency
 * Frekuensi Pembelian
 *
 * Stratum I, phase B5, structural class C2, decision domain D5.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const purchase_frequency: Relation = Object.freeze({
  formulaId: "purchase_frequency",
  symbol: "Purchase_Frequency",
  name: { id: "Frekuensi Pembelian", en: "Purchase Frequency" },
  inputs: Object.freeze(["orders", "unique_customers"]),
  output: "purchase_frequency",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "orders / unique_customers",
  latex: "PF = \\dfrac{Orders}{UniqueCustomers}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const orders = num(env, "orders");
    const unique_customers = num(env, "unique_customers");
    return orders / unique_customers;
  },
  inverses: Object.freeze({
    "orders": (env: Env): number => {
    const purchase_frequency = num(env, "purchase_frequency");
    const unique_customers = num(env, "unique_customers");
      return purchase_frequency * unique_customers;
    },
    "unique_customers": (env: Env): number => {
    const orders = num(env, "orders");
    const purchase_frequency = num(env, "purchase_frequency");
      return orders / purchase_frequency;
    },
  }),
  inverseSources: Object.freeze({
    "orders": "purchase_frequency * unique_customers",
    "unique_customers": "orders / purchase_frequency",
  }),
  guards: buildGuards({
    formulaId: "purchase_frequency",
    inputs: ["orders", "unique_customers"],
    denominators: ["purchase_frequency", "unique_customers"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 1.2, label: "Sekali beli", guidance: "Model bisnis bergantung pada akuisisi terus menerus." },
    { lower: 1.2, upper: 2.5, label: "Berulang lemah", guidance: "Ada pengulangan namun belum menjadi kebiasaan." },
    { lower: 2.5, upper: 6, label: "Berulang kuat", guidance: "Basis pelanggan memiliki kebiasaan membeli." },
    { lower: 6, upper: 1000, label: "Sangat sering", guidance: "Lazim pada kategori konsumsi harian." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B5",
    structuralClass: "C2",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 2,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "orders": 1480,
    "unique_customers": 620,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 10,
    xpRepeat: 2,
    masteryThreshold: 4,
    badgeId: "badge_purchase_frequency",
    unlocksAfterModule: 1,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: true,
});
