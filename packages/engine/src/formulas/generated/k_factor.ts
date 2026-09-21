// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * K_Factor_Virality: Viral K-Factor
 * Faktor K Viralitas
 *
 * Stratum V, phase B7, structural class C4, decision domain D4.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const k_factor: Relation = Object.freeze({
  formulaId: "k_factor",
  symbol: "K_Factor_Virality",
  name: { id: "Faktor K Viralitas", en: "Viral K-Factor" },
  inputs: Object.freeze(["invites_per_user", "invite_conversion"]),
  output: "k_factor",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "invites_per_user * invite_conversion",
  latex: "K = InvitesPerUser \\times InviteConversion",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const invites_per_user = num(env, "invites_per_user");
    const invite_conversion = num(env, "invite_conversion");
    return invites_per_user * invite_conversion;
  },
  inverses: Object.freeze({
    "invites_per_user": (env: Env): number => {
    const result = num(env, "k_factor");
    const invite_conversion = num(env, "invite_conversion");
      return result / invite_conversion;
    },
    "invite_conversion": (env: Env): number => {
    const result = num(env, "k_factor");
    const invites_per_user = num(env, "invites_per_user");
      return result / invites_per_user;
    },
  }),
  inverseSources: Object.freeze({
    "invites_per_user": "result / invite_conversion",
    "invite_conversion": "result / invites_per_user",
  }),
  guards: buildGuards({
    formulaId: "k_factor",
    inputs: ["invites_per_user", "invite_conversion"],
    denominators: ["invite_conversion", "invites_per_user"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.3, label: "Lemah", guidance: "Pertumbuhan hampir seluruhnya bergantung pada belanja berbayar." },
    { lower: 0.3, upper: 0.7, label: "Membantu", guidance: "Viralitas menurunkan biaya akuisisi efektif." },
    { lower: 0.7, upper: 1, label: "Kuat", guidance: "Mendekati ambang pertumbuhan mandiri." },
    { lower: 1, upper: 100, label: "Eksponensial", guidance: "Jarang bertahan lama. Periksa keberlanjutan asumsi." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B7",
    structuralClass: "C4",
    decisionDomain: "D4",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "invites_per_user": 3.2,
    "invite_conversion": 0.18,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 45,
    xpRepeat: 9,
    masteryThreshold: 3,
    badgeId: "badge_k_factor",
    unlocksAfterModule: 8,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
