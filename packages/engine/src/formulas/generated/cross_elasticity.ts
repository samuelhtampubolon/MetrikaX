// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Cross_Elasticity: Cross-Price Elasticity
 * Elastisitas Silang
 *
 * Stratum VII, phase B0, structural class C8, decision domain D2.
 * Engine rule: store observed range; grey out extrapolated region in the chart
 */
export const cross_elasticity: Relation = Object.freeze({
  formulaId: "cross_elasticity",
  symbol: "Cross_Elasticity",
  name: { id: "Elastisitas Silang", en: "Cross-Price Elasticity" },
  inputs: Object.freeze(["qx1", "qx2", "py1", "py2"]),
  output: "cross_elasticity",
  structuralClass: "C8",
  resultBounds: null,
  expressionSource: "((qx2 - qx1) / ((qx1 + qx2) / 2)) / ((py2 - py1) / ((py1 + py2) / 2))",
  latex: "E_{xy} = \\dfrac{(Q_{x2} - Q_{x1}) / \\left[(Q_{x1} + Q_{x2})/2\\right]}{(P_{y2} - P_{y1}) / \\left[(P_{y1} + P_{y2})/2\\right]}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const qx2 = num(env, "qx2");
    const qx1 = num(env, "qx1");
    const py2 = num(env, "py2");
    const py1 = num(env, "py1");
    return ((qx2 - qx1) / ((qx1 + qx2) / 2)) / ((py2 - py1) / ((py1 + py2) / 2));
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "cross_elasticity",
    inputs: ["qx1", "qx2", "py1", "py2"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1000, upper: -0.1, label: "Komplementer", guidance: "Kedua produk dikonsumsi bersama." },
    { lower: -0.1, upper: 0.1, label: "Tidak terkait", guidance: "Bukan pesaing dan bukan pelengkap." },
    { lower: 0.1, upper: 1000, label: "Substitusi", guidance: "Kedua produk bersaing langsung." },
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
    "qx1": 1200,
    "qx2": 1380,
    "py1": 98000,
    "py2": 115000,
  }),
  publishesToGraph: false,
});
