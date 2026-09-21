// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CTR: Click-Through Rate
 * Tingkat Klik Tayang
 *
 * Stratum I, phase B3, structural class C1, decision domain D3.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const ctr: Relation = Object.freeze({
  formulaId: "ctr",
  symbol: "CTR",
  name: { id: "Tingkat Klik Tayang", en: "Click-Through Rate" },
  inputs: Object.freeze(["clicks", "impressions"]),
  output: "ctr_out",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "clicks / impressions",
  latex: "CTR = \\dfrac{Clicks}{Impressions}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const clicks = num(env, "clicks");
    const impressions = num(env, "impressions");
    return clicks / impressions;
  },
  inverses: Object.freeze({
    "clicks": (env: Env): number => {
    const ctr_out = num(env, "ctr_out");
    const impressions = num(env, "impressions");
      return ctr_out * impressions;
    },
    "impressions": (env: Env): number => {
    const clicks = num(env, "clicks");
    const ctr_out = num(env, "ctr_out");
      return clicks / ctr_out;
    },
  }),
  inverseSources: Object.freeze({
    "clicks": "ctr_out * impressions",
    "impressions": "clicks / ctr_out",
  }),
  guards: buildGuards({
    formulaId: "ctr",
    inputs: ["clicks", "impressions"],
    denominators: ["ctr_out", "impressions"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.005, label: "Rendah", guidance: "Kreatif atau penargetan tidak relevan bagi audiens." },
    { lower: 0.005, upper: 0.02, label: "Wajar", guidance: "Berada pada rentang lazim kampanye display dan sosial." },
    { lower: 0.02, upper: 0.1, label: "Baik", guidance: "Relevansi pesan tinggi. Periksa apakah audiens terlalu sempit." },
    { lower: 0.1, upper: 1, label: "Curiga", guidance: "Periksa lalu lintas tidak sah atau penghitungan ganda." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B3",
    structuralClass: "C1",
    decisionDomain: "D3",
    computeLayer: "L1",
    curriculumModule: 1,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "clicks": 1250,
    "impressions": 100000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 10,
    xpRepeat: 2,
    masteryThreshold: 4,
    badgeId: "badge_ctr",
    unlocksAfterModule: 1,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: true,
});
