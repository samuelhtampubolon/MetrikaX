// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * ROI: Return on Investment
 * Pengembalian atas Investasi
 *
 * Stratum IV, phase B8, structural class C2, decision domain D8.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const roi: Relation = Object.freeze({
  formulaId: "roi",
  symbol: "ROI",
  name: { id: "Pengembalian atas Investasi", en: "Return on Investment" },
  inputs: Object.freeze(["gain", "cost"]),
  output: "roi",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "(gain - cost) / cost",
  latex: "ROI = \\dfrac{Gain - Cost}{Cost}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const gain = num(env, "gain");
    const cost = num(env, "cost");
    return (gain - cost) / cost;
  },
  inverses: Object.freeze({
    "gain": (env: Env): number => {
    const cost = num(env, "cost");
    const result = num(env, "roi");
      return cost * (1 + result);
    },
    "cost": (env: Env): number => {
    const gain = num(env, "gain");
    const result = num(env, "roi");
      return gain / (1 + result);
    },
  }),
  inverseSources: Object.freeze({
    "gain": "cost * (1 + result)",
    "cost": "gain / (1 + result)",
  }),
  guards: buildGuards({
    formulaId: "roi",
    inputs: ["gain", "cost"],
    denominators: ["cost"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1, upper: 0, label: "Negatif", guidance: "Investasi menghancurkan nilai." },
    { lower: 0, upper: 0.2, label: "Marjinal", guidance: "Bandingkan dengan biaya modal sebelum menyimpulkan." },
    { lower: 0.2, upper: 1, label: "Baik", guidance: "Melampaui biaya modal pada sebagian besar konteks." },
    { lower: 1, upper: 1000, label: "Sangat baik", guidance: "Periksa apakah seluruh biaya telah dimasukkan." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "IV",
    phase: "B8",
    structuralClass: "C2",
    decisionDomain: "D8",
    computeLayer: "L2",
    curriculumModule: 6,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "gain": 96000000,
    "cost": 42000000,
  }),
  publishesToGraph: false,
});
