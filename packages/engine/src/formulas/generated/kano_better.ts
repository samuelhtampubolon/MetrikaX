// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Kano_Better: Kano Better Coefficient
 * Koefisien Kepuasan Kano
 *
 * Stratum VIII, phase B1, structural class C3, decision domain D1.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const kano_better: Relation = Object.freeze({
  formulaId: "kano_better",
  symbol: "Kano_Better",
  name: { id: "Koefisien Kepuasan Kano", en: "Kano Better Coefficient" },
  inputs: Object.freeze(["kano_a", "kano_o", "kano_m", "kano_i"]),
  output: "kano_better",
  structuralClass: "C3",
  resultBounds: null,
  expressionSource: "(kano_a + kano_o) / (kano_a + kano_o + kano_m + kano_i)",
  latex: "Better = \\dfrac{A + O}{A + O + M + I}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const kano_a = num(env, "kano_a");
    const kano_o = num(env, "kano_o");
    const kano_m = num(env, "kano_m");
    const kano_i = num(env, "kano_i");
    return (kano_a + kano_o) / (kano_a + kano_o + kano_m + kano_i);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "kano_better",
    inputs: ["kano_a", "kano_o", "kano_m", "kano_i"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.3, label: "Dampak rendah", guidance: "Menambahkan fitur ini sedikit menaikkan kepuasan." },
    { lower: 0.3, upper: 0.6, label: "Dampak sedang", guidance: "Fitur layak dipertimbangkan." },
    { lower: 0.6, upper: 1, label: "Dampak tinggi", guidance: "Fitur berpotensi menjadi pembeda utama." },
  ]),
  pitfallCount: 3,
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
  gamification: Object.freeze({
    xpFirstSolve: 70,
    xpRepeat: 14,
    masteryThreshold: 3,
    badgeId: "badge_kano_better",
    unlocksAfterModule: 7,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
