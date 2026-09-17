// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Pipeline_Coverage: Pipeline Coverage
 * Cakupan Pipeline
 *
 * Stratum V, phase B4, structural class C2, decision domain D6.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const pipeline_coverage: Relation = Object.freeze({
  formulaId: "pipeline_coverage",
  symbol: "Pipeline_Coverage",
  name: { id: "Cakupan Pipeline", en: "Pipeline Coverage" },
  inputs: Object.freeze(["pipeline_value", "quota"]),
  output: "pipeline_coverage",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "pipeline_value / quota",
  latex: "PC = \\dfrac{PipelineValue}{Quota}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const pipeline_value = num(env, "pipeline_value");
    const quota = num(env, "quota");
    return pipeline_value / quota;
  },
  inverses: Object.freeze({
    "pipeline_value": (env: Env): number => {
    const result = num(env, "pipeline_coverage");
    const quota = num(env, "quota");
      return result * quota;
    },
    "quota": (env: Env): number => {
    const pipeline_value = num(env, "pipeline_value");
    const result = num(env, "pipeline_coverage");
      return pipeline_value / result;
    },
  }),
  inverseSources: Object.freeze({
    "pipeline_value": "result * quota",
    "quota": "pipeline_value / result",
  }),
  guards: buildGuards({
    formulaId: "pipeline_coverage",
    inputs: ["pipeline_value", "quota"],
    denominators: ["pipeline_coverage", "quota"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 2, label: "Tidak memadai", guidance: "Target hampir pasti tidak tercapai." },
    { lower: 2, upper: 3, label: "Ketat", guidance: "Menuntut tingkat kemenangan di atas normal." },
    { lower: 3, upper: 5, label: "Memadai", guidance: "Rentang yang lazim dianggap sehat." },
    { lower: 5, upper: 1000, label: "Berlebih", guidance: "Periksa apakah pipeline berisi peluang yang sudah mati." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B4",
    structuralClass: "C2",
    decisionDomain: "D6",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "pipeline_value": 1120000000,
    "quota": 320000000,
  }),
  publishesToGraph: false,
});
