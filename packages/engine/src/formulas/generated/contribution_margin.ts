// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Contribution_Margin: Contribution Margin
 * Marjin Kontribusi
 *
 * Stratum III, phase B1, structural class C3, decision domain D2.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const contribution_margin: Relation = Object.freeze({
  formulaId: "contribution_margin",
  symbol: "Contribution_Margin",
  name: { id: "Marjin Kontribusi", en: "Contribution Margin" },
  inputs: Object.freeze(["price", "variable_cost"]),
  output: "contribution_margin",
  structuralClass: "C3",
  resultBounds: null,
  expressionSource: "price - variable_cost",
  latex: "CM = Price - VariableCost",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const price = num(env, "price");
    const variable_cost = num(env, "variable_cost");
    return price - variable_cost;
  },
  inverses: Object.freeze({
    "price": (env: Env): number => {
    const result = num(env, "contribution_margin");
    const variable_cost = num(env, "variable_cost");
      return result + variable_cost;
    },
    "variable_cost": (env: Env): number => {
    const price = num(env, "price");
    const result = num(env, "contribution_margin");
      return price - result;
    },
  }),
  inverseSources: Object.freeze({
    "price": "result + variable_cost",
    "variable_cost": "price - result",
  }),
  guards: buildGuards({
    formulaId: "contribution_margin",
    inputs: ["price", "variable_cost"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "III",
    phase: "B1",
    structuralClass: "C3",
    decisionDomain: "D2",
    computeLayer: "L1",
    curriculumModule: 3,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "price": 125000,
    "variable_cost": 74000,
  }),
  publishesToGraph: false,
});
