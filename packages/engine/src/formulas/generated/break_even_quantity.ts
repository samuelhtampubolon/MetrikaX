// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Break_Even_Quantity: Break-Even Quantity
 * Kuantitas Titik Impas
 *
 * Stratum III, phase B1, structural class C2, decision domain D2.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const break_even_quantity: Relation = Object.freeze({
  formulaId: "break_even_quantity",
  symbol: "Break_Even_Quantity",
  name: { id: "Kuantitas Titik Impas", en: "Break-Even Quantity" },
  inputs: Object.freeze(["fixed_cost", "price", "variable_cost"]),
  output: "break_even_quantity",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "fixed_cost / (price - variable_cost)",
  latex: "BEQ = \\dfrac{FixedCost}{Price - VariableCost}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const fixed_cost = num(env, "fixed_cost");
    const price = num(env, "price");
    const variable_cost = num(env, "variable_cost");
    return fixed_cost / (price - variable_cost);
  },
  inverses: Object.freeze({
    "fixed_cost": (env: Env): number => {
    const result = num(env, "break_even_quantity");
    const price = num(env, "price");
    const variable_cost = num(env, "variable_cost");
      return result * (price - variable_cost);
    },
    "price": (env: Env): number => {
    const fixed_cost = num(env, "fixed_cost");
    const result = num(env, "break_even_quantity");
    const variable_cost = num(env, "variable_cost");
      return fixed_cost / result + variable_cost;
    },
    "variable_cost": (env: Env): number => {
    const price = num(env, "price");
    const fixed_cost = num(env, "fixed_cost");
    const result = num(env, "break_even_quantity");
      return price - fixed_cost / result;
    },
  }),
  inverseSources: Object.freeze({
    "fixed_cost": "result * (price - variable_cost)",
    "price": "fixed_cost / result + variable_cost",
    "variable_cost": "price - fixed_cost / result",
  }),
  guards: buildGuards({
    formulaId: "break_even_quantity",
    inputs: ["fixed_cost", "price", "variable_cost"],
    denominators: ["break_even_quantity"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "III",
    phase: "B1",
    structuralClass: "C2",
    decisionDomain: "D2",
    computeLayer: "L1",
    curriculumModule: 3,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "fixed_cost": 480000000,
    "price": 125000,
    "variable_cost": 74000,
  }),
  publishesToGraph: false,
});
