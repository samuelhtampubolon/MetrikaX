// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CAC: Customer Acquisition Cost
 * Biaya Akuisisi Pelanggan
 *
 * Stratum IV, phase B4, structural class C2, decision domain D6.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const cac: Relation = Object.freeze({
  formulaId: "cac",
  symbol: "CAC",
  name: { id: "Biaya Akuisisi Pelanggan", en: "Customer Acquisition Cost" },
  inputs: Object.freeze(["total_acquisition_cost", "new_customers"]),
  output: "cac",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "total_acquisition_cost / new_customers",
  latex: "CAC = \\dfrac{TotalAcquisitionCost}{NewCustomers}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const total_acquisition_cost = num(env, "total_acquisition_cost");
    const new_customers = num(env, "new_customers");
    return total_acquisition_cost / new_customers;
  },
  inverses: Object.freeze({
    "total_acquisition_cost": (env: Env): number => {
    const cac = num(env, "cac");
    const new_customers = num(env, "new_customers");
      return cac * new_customers;
    },
    "new_customers": (env: Env): number => {
    const total_acquisition_cost = num(env, "total_acquisition_cost");
    const cac = num(env, "cac");
      return total_acquisition_cost / cac;
    },
  }),
  inverseSources: Object.freeze({
    "total_acquisition_cost": "cac * new_customers",
    "new_customers": "total_acquisition_cost / cac",
  }),
  guards: buildGuards({
    formulaId: "cac",
    inputs: ["total_acquisition_cost", "new_customers"],
    denominators: ["cac", "new_customers"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "IV",
    phase: "B4",
    structuralClass: "C2",
    decisionDomain: "D6",
    computeLayer: "L1",
    curriculumModule: 6,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "total_acquisition_cost": 42000000,
    "new_customers": 113,
  }),
  publishesToGraph: true,
});
