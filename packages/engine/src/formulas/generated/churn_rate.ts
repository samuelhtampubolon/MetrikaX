// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Churn_Rate: Churn Rate
 * Tingkat Berhenti Pelanggan
 *
 * Stratum I, phase B6, structural class C1, decision domain D5.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const churn_rate: Relation = Object.freeze({
  formulaId: "churn_rate",
  symbol: "Churn_Rate",
  name: { id: "Tingkat Berhenti Pelanggan", en: "Churn Rate" },
  inputs: Object.freeze(["lost_customers", "start_customers"]),
  output: "churn_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "lost_customers / start_customers",
  latex: "Churn = \\dfrac{LostCustomers}{StartCustomers}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const lost_customers = num(env, "lost_customers");
    const start_customers = num(env, "start_customers");
    return lost_customers / start_customers;
  },
  inverses: Object.freeze({
    "lost_customers": (env: Env): number => {
    const churn_rate = num(env, "churn_rate");
    const start_customers = num(env, "start_customers");
      return churn_rate * start_customers;
    },
    "start_customers": (env: Env): number => {
    const lost_customers = num(env, "lost_customers");
    const churn_rate = num(env, "churn_rate");
      return lost_customers / churn_rate;
    },
  }),
  inverseSources: Object.freeze({
    "lost_customers": "churn_rate * start_customers",
    "start_customers": "lost_customers / churn_rate",
  }),
  guards: buildGuards({
    formulaId: "churn_rate",
    inputs: ["lost_customers", "start_customers"],
    denominators: ["churn_rate", "start_customers"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.02, label: "Sangat baik", guidance: "Basis pelanggan sangat lekat." },
    { lower: 0.02, upper: 0.05, label: "Baik", guidance: "Rentang sehat bagi langganan bulanan." },
    { lower: 0.05, upper: 0.1, label: "Waspada", guidance: "Nilai seumur hidup tertekan." },
    { lower: 0.1, upper: 1, label: "Kritis", guidance: "Akuisisi tidak akan mampu mengejar kebocoran." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B6",
    structuralClass: "C1",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 4,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "lost_customers": 38,
    "start_customers": 940,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 10,
    xpRepeat: 2,
    masteryThreshold: 4,
    badgeId: "badge_churn_rate",
    unlocksAfterModule: 3,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: true,
});
