// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Cost_of_Delay: Cost of Delay
 * Biaya Penundaan
 *
 * Stratum X, phase B8, structural class C3, decision domain D1.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const cost_of_delay: Relation = Object.freeze({
  formulaId: "cost_of_delay",
  symbol: "Cost_of_Delay",
  name: { id: "Biaya Penundaan", en: "Cost of Delay" },
  inputs: Object.freeze(["delta_value", "delta_time"]),
  output: "cost_of_delay",
  structuralClass: "C3",
  expressionSource: "delta_value / delta_time",
  latex: "CoD = \\dfrac{\\Delta Value}{\\Delta Time}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const delta_value = num(env, "delta_value");
    const delta_time = num(env, "delta_time");
    return delta_value / delta_time;
  },
  inverses: Object.freeze({
    "delta_value": (env: Env): number => {
    const result = num(env, "cost_of_delay");
    const delta_time = num(env, "delta_time");
      return result * delta_time;
    },
    "delta_time": (env: Env): number => {
    const delta_value = num(env, "delta_value");
    const result = num(env, "cost_of_delay");
      return delta_value / result;
    },
  }),
  inverseSources: Object.freeze({
    "delta_value": "result * delta_time",
    "delta_time": "delta_value / result",
  }),
  guards: buildGuards({
    formulaId: "cost_of_delay",
    inputs: ["delta_value", "delta_time"],
    denominators: ["cost_of_delay", "delta_time"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "X",
    phase: "B8",
    structuralClass: "C3",
    decisionDomain: "D1",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "delta_value": 240000000,
    "delta_time": 3,
  }),
  publishesToGraph: false,
});
