// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * RFM_Score: RFM Score
 * Skor RFM
 *
 * Stratum V, phase B6, structural class C5, decision domain D5.
 * Engine rule: require weight_provenance field; run rank-stability perturbation test
 */
export const rfm_score: Relation = Object.freeze({
  formulaId: "rfm_score",
  symbol: "RFM_Score",
  name: { id: "Skor RFM", en: "RFM Score" },
  inputs: Object.freeze(["rfm_r", "rfm_f", "rfm_m", "rfm_wr", "rfm_wf", "rfm_wm"]),
  output: "rfm_score",
  structuralClass: "C5",
  resultBounds: null,
  expressionSource: "rfm_wr * rfm_r + rfm_wf * rfm_f + rfm_wm * rfm_m",
  latex: "RFM = w_R R + w_F F + w_M M",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const rfm_wr = num(env, "rfm_wr");
    const rfm_r = num(env, "rfm_r");
    const rfm_wf = num(env, "rfm_wf");
    const rfm_f = num(env, "rfm_f");
    const rfm_wm = num(env, "rfm_wm");
    const rfm_m = num(env, "rfm_m");
    return rfm_wr * rfm_r + rfm_wf * rfm_f + rfm_wm * rfm_m;
  },
  inverses: Object.freeze({
    "rfm_r": (env: Env): number => {
    const result = num(env, "rfm_score");
    const rfm_wf = num(env, "rfm_wf");
    const rfm_f = num(env, "rfm_f");
    const rfm_wm = num(env, "rfm_wm");
    const rfm_m = num(env, "rfm_m");
    const rfm_wr = num(env, "rfm_wr");
      return (result - rfm_wf * rfm_f - rfm_wm * rfm_m) / rfm_wr;
    },
    "rfm_f": (env: Env): number => {
    const result = num(env, "rfm_score");
    const rfm_wr = num(env, "rfm_wr");
    const rfm_r = num(env, "rfm_r");
    const rfm_wm = num(env, "rfm_wm");
    const rfm_m = num(env, "rfm_m");
    const rfm_wf = num(env, "rfm_wf");
      return (result - rfm_wr * rfm_r - rfm_wm * rfm_m) / rfm_wf;
    },
    "rfm_m": (env: Env): number => {
    const result = num(env, "rfm_score");
    const rfm_wr = num(env, "rfm_wr");
    const rfm_r = num(env, "rfm_r");
    const rfm_wf = num(env, "rfm_wf");
    const rfm_f = num(env, "rfm_f");
    const rfm_wm = num(env, "rfm_wm");
      return (result - rfm_wr * rfm_r - rfm_wf * rfm_f) / rfm_wm;
    },
  }),
  inverseSources: Object.freeze({
    "rfm_r": "(result - rfm_wf * rfm_f - rfm_wm * rfm_m) / rfm_wr",
    "rfm_f": "(result - rfm_wr * rfm_r - rfm_wm * rfm_m) / rfm_wf",
    "rfm_m": "(result - rfm_wr * rfm_r - rfm_wf * rfm_f) / rfm_wm",
  }),
  guards: buildGuards({
    formulaId: "rfm_score",
    inputs: ["rfm_r", "rfm_f", "rfm_m", "rfm_wr", "rfm_wf", "rfm_wm"],
    denominators: ["rfm_wf", "rfm_wm", "rfm_wr"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 1, upper: 2.5, label: "Segmen pasif", guidance: "Prioritas reaktivasi atau pelepasan." },
    { lower: 2.5, upper: 3.5, label: "Segmen tengah", guidance: "Prioritas peningkatan frekuensi." },
    { lower: 3.5, upper: 4.5, label: "Segmen bernilai", guidance: "Prioritas retensi." },
    { lower: 4.5, upper: 5, label: "Segmen utama", guidance: "Prioritas program loyalitas dan rujukan." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B6",
    structuralClass: "C5",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 5,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "rfm_r": 4,
    "rfm_f": 3,
    "rfm_m": 5,
    "rfm_wr": 0.4,
    "rfm_wf": 0.3,
    "rfm_wm": 0.3,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 45,
    xpRepeat: 9,
    masteryThreshold: 3,
    badgeId: "badge_rfm_score",
    unlocksAfterModule: 4,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
