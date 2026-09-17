// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Lead_to_Customer_Rate: Lead to Customer Rate
 * Tingkat Prospek ke Pelanggan
 *
 * Stratum I, phase B4, structural class C1, decision domain D6.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const lead_to_customer_rate: Relation = Object.freeze({
  formulaId: "lead_to_customer_rate",
  symbol: "Lead_to_Customer_Rate",
  name: { id: "Tingkat Prospek ke Pelanggan", en: "Lead to Customer Rate" },
  inputs: Object.freeze(["customers", "leads"]),
  output: "lead_to_customer_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "customers / leads",
  latex: "L2C = \\dfrac{Customers}{Leads}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const customers = num(env, "customers");
    const leads = num(env, "leads");
    return customers / leads;
  },
  inverses: Object.freeze({
    "customers": (env: Env): number => {
    const result = num(env, "lead_to_customer_rate");
    const leads = num(env, "leads");
      return result * leads;
    },
    "leads": (env: Env): number => {
    const customers = num(env, "customers");
    const result = num(env, "lead_to_customer_rate");
      return customers / result;
    },
  }),
  inverseSources: Object.freeze({
    "customers": "result * leads",
    "leads": "customers / result",
  }),
  guards: buildGuards({
    formulaId: "lead_to_customer_rate",
    inputs: ["customers", "leads"],
    denominators: ["lead_to_customer_rate", "leads"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.05, label: "Rendah", guidance: "Kualitas prospek atau proses tindak lanjut lemah." },
    { lower: 0.05, upper: 0.15, label: "Wajar", guidance: "Rentang lazim." },
    { lower: 0.15, upper: 0.4, label: "Baik", guidance: "Prospek tersaring dengan baik." },
    { lower: 0.4, upper: 1, label: "Sangat tinggi", guidance: "Volume prospek kemungkinan terlalu kecil." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B4",
    structuralClass: "C1",
    decisionDomain: "D6",
    computeLayer: "L1",
    curriculumModule: 1,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "customers": 92,
    "leads": 840,
  }),
  publishesToGraph: false,
});
