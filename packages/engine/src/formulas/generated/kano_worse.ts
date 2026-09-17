// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Kano_Worse: Kano Worse Coefficient
 * Koefisien Ketidakpuasan Kano
 *
 * Stratum VIII, phase B1, structural class C3, decision domain D1.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const kano_worse: Relation = Object.freeze({
  formulaId: "kano_worse",
  symbol: "Kano_Worse",
  name: { id: "Koefisien Ketidakpuasan Kano", en: "Kano Worse Coefficient" },
  inputs: Object.freeze(["kano_a", "kano_o", "kano_m", "kano_i"]),
  output: "kano_worse",
  structuralClass: "C3",
  resultBounds: null,
  expressionSource: "-1 * (kano_o + kano_m) / (kano_a + kano_o + kano_m + kano_i)",
  latex: "Worse = -\\dfrac{O + M}{A + O + M + I}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const kano_o = num(env, "kano_o");
    const kano_m = num(env, "kano_m");
    const kano_a = num(env, "kano_a");
    const kano_i = num(env, "kano_i");
    return -1 * (kano_o + kano_m) / (kano_a + kano_o + kano_m + kano_i);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "kano_worse",
    inputs: ["kano_a", "kano_o", "kano_m", "kano_i"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1, upper: -0.6, label: "Risiko tinggi", guidance: "Ketiadaan fitur menimbulkan ketidakpuasan besar." },
    { lower: -0.6, upper: -0.3, label: "Risiko sedang", guidance: "Ketiadaan fitur terasa namun tidak menghancurkan." },
    { lower: -0.3, upper: 0, label: "Risiko rendah", guidance: "Fitur dapat ditunda tanpa akibat berat." },
  ]),
  taxonomy: Object.freeze({
    stratum: "VIII",
    phase: "B1",
    structuralClass: "C3",
    decisionDomain: "D1",
    computeLayer: "L1",
    curriculumModule: 8,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "kano_a": 148,
    "kano_o": 96,
    "kano_m": 112,
    "kano_i": 64,
  }),
  publishesToGraph: false,
});
