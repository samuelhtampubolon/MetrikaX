// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Retention_Rate: Retention Rate
 * Tingkat Retensi Pelanggan
 *
 * Stratum I, phase B6, structural class C1, decision domain D5.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const retention_rate: Relation = Object.freeze({
  formulaId: "retention_rate",
  symbol: "Retention_Rate",
  name: { id: "Tingkat Retensi Pelanggan", en: "Retention Rate" },
  inputs: Object.freeze(["end_customers", "new_customers", "start_customers"]),
  output: "retention_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "(end_customers - new_customers) / start_customers",
  latex: "RR = \\dfrac{EndCustomers - NewCustomers}{StartCustomers}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const end_customers = num(env, "end_customers");
    const new_customers = num(env, "new_customers");
    const start_customers = num(env, "start_customers");
    return (end_customers - new_customers) / start_customers;
  },
  inverses: Object.freeze({
    "end_customers": (env: Env): number => {
    const retention_rate = num(env, "retention_rate");
    const start_customers = num(env, "start_customers");
    const new_customers = num(env, "new_customers");
      return retention_rate * start_customers + new_customers;
    },
    "new_customers": (env: Env): number => {
    const end_customers = num(env, "end_customers");
    const retention_rate = num(env, "retention_rate");
    const start_customers = num(env, "start_customers");
      return end_customers - retention_rate * start_customers;
    },
    "start_customers": (env: Env): number => {
    const end_customers = num(env, "end_customers");
    const new_customers = num(env, "new_customers");
    const retention_rate = num(env, "retention_rate");
      return (end_customers - new_customers) / retention_rate;
    },
  }),
  inverseSources: Object.freeze({
    "end_customers": "retention_rate * start_customers + new_customers",
    "new_customers": "end_customers - retention_rate * start_customers",
    "start_customers": "(end_customers - new_customers) / retention_rate",
  }),
  guards: buildGuards({
    formulaId: "retention_rate",
    inputs: ["end_customers", "new_customers", "start_customers"],
    denominators: ["retention_rate", "start_customers"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.7, label: "Rendah", guidance: "Model bisnis bergantung pada akuisisi tanpa henti." },
    { lower: 0.7, upper: 0.9, label: "Wajar", guidance: "Ada basis yang bertahan namun kebocoran nyata." },
    { lower: 0.9, upper: 0.98, label: "Baik", guidance: "Rentang sehat langganan bulanan." },
    { lower: 0.98, upper: 1, label: "Sangat baik", guidance: "Periksa apakah definisi aktif terlalu longgar." },
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
    "end_customers": 1015,
    "new_customers": 113,
    "start_customers": 940,
  }),
  publishesToGraph: true,
});
