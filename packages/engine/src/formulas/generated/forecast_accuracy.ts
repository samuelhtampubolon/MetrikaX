// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Forecast_Accuracy: Forecast Accuracy
 * Akurasi Prakiraan
 *
 * Stratum V, phase B8, structural class C3, decision domain D6.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const forecast_accuracy: Relation = Object.freeze({
  formulaId: "forecast_accuracy",
  symbol: "Forecast_Accuracy",
  name: { id: "Akurasi Prakiraan", en: "Forecast Accuracy" },
  inputs: Object.freeze(["forecast", "actual"]),
  output: "forecast_accuracy",
  structuralClass: "C3",
  resultBounds: null,
  expressionSource: "1 - Math.abs(forecast - actual) / Math.abs(actual)",
  latex: "FA = 1 - \\dfrac{|Forecast - Actual|}{|Actual|}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const forecast = num(env, "forecast");
    const actual = num(env, "actual");
    return 1 - Math.abs(forecast - actual) / Math.abs(actual);
  },
  inverses: Object.freeze({
    "forecast": (env: Env): number => {
    const actual = num(env, "actual");
    const result = num(env, "forecast_accuracy");
      return actual * (2 - result);
    },
    "actual": (env: Env): number => {
    const forecast = num(env, "forecast");
    const result = num(env, "forecast_accuracy");
      return forecast / (2 - result);
    },
  }),
  inverseSources: Object.freeze({
    "forecast": "actual * (2 - result)",
    "actual": "forecast / (2 - result)",
  }),
  guards: buildGuards({
    formulaId: "forecast_accuracy",
    inputs: ["forecast", "actual"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -10, upper: 0.7, label: "Rendah", guidance: "Prakiraan belum layak dipakai untuk keputusan kapasitas." },
    { lower: 0.7, upper: 0.85, label: "Wajar", guidance: "Cukup untuk perencanaan kasar." },
    { lower: 0.85, upper: 0.95, label: "Baik", guidance: "Layak untuk perencanaan operasional." },
    { lower: 0.95, upper: 1, label: "Sangat baik", guidance: "Periksa apakah prakiraan disesuaikan setelah fakta." },
  ]),
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B8",
    structuralClass: "C3",
    decisionDomain: "D6",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "forecast": 340000000,
    "actual": 318000000,
  }),
  publishesToGraph: false,
});
