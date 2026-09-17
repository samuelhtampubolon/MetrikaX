// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Income_Elasticity: Income Elasticity of Demand
 * Elastisitas Pendapatan
 *
 * Stratum VII, phase B0, structural class C8, decision domain D2.
 * Engine rule: store observed range; grey out extrapolated region in the chart
 */
export const income_elasticity: Relation = Object.freeze({
  formulaId: "income_elasticity",
  symbol: "Income_Elasticity",
  name: { id: "Elastisitas Pendapatan", en: "Income Elasticity of Demand" },
  inputs: Object.freeze(["q1", "q2", "i1", "i2"]),
  output: "income_elasticity",
  structuralClass: "C8",
  resultBounds: null,
  expressionSource: "((q2 - q1) / ((q1 + q2) / 2)) / ((i2 - i1) / ((i1 + i2) / 2))",
  latex: "E_i = \\dfrac{(Q_2 - Q_1) / \\left[(Q_1 + Q_2)/2\\right]}{(I_2 - I_1) / \\left[(I_1 + I_2)/2\\right]}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const q2 = num(env, "q2");
    const q1 = num(env, "q1");
    const i2 = num(env, "i2");
    const i1 = num(env, "i1");
    return ((q2 - q1) / ((q1 + q2) / 2)) / ((i2 - i1) / ((i1 + i2) / 2));
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "income_elasticity",
    inputs: ["q1", "q2", "i1", "i2"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1000, upper: 0, label: "Barang inferior", guidance: "Permintaan turun saat pendapatan naik." },
    { lower: 0, upper: 1, label: "Kebutuhan pokok", guidance: "Permintaan naik lebih lambat daripada pendapatan." },
    { lower: 1, upper: 1000, label: "Barang mewah", guidance: "Permintaan naik lebih cepat daripada pendapatan." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "VII",
    phase: "B0",
    structuralClass: "C8",
    decisionDomain: "D2",
    computeLayer: "L1",
    curriculumModule: 7,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "q1": 1200,
    "q2": 1560,
    "i1": 4800000,
    "i2": 5600000,
  }),
  publishesToGraph: false,
});
