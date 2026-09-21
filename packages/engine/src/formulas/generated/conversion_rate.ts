// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Conversion_Rate: Conversion Rate
 * Tingkat Konversi
 *
 * Stratum I, phase B4, structural class C1, decision domain D4.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const conversion_rate: Relation = Object.freeze({
  formulaId: "conversion_rate",
  symbol: "Conversion_Rate",
  name: { id: "Tingkat Konversi", en: "Conversion Rate" },
  inputs: Object.freeze(["conversions", "visitors"]),
  output: "conversion_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "conversions / visitors",
  latex: "CVR = \\dfrac{Conversions}{Visitors}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const conversions = num(env, "conversions");
    const visitors = num(env, "visitors");
    return conversions / visitors;
  },
  inverses: Object.freeze({
    "conversions": (env: Env): number => {
    const conversion_rate = num(env, "conversion_rate");
    const visitors = num(env, "visitors");
      return conversion_rate * visitors;
    },
    "visitors": (env: Env): number => {
    const conversions = num(env, "conversions");
    const conversion_rate = num(env, "conversion_rate");
      return conversions / conversion_rate;
    },
  }),
  inverseSources: Object.freeze({
    "conversions": "conversion_rate * visitors",
    "visitors": "conversions / conversion_rate",
  }),
  guards: buildGuards({
    formulaId: "conversion_rate",
    inputs: ["conversions", "visitors"],
    denominators: ["conversion_rate", "visitors"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.01, label: "Rendah", guidance: "Periksa kecocokan penawaran dan hambatan pada formulir." },
    { lower: 0.01, upper: 0.03, label: "Wajar", guidance: "Rentang lazim ritel daring." },
    { lower: 0.03, upper: 0.1, label: "Baik", guidance: "Kecocokan penawaran kuat." },
    { lower: 0.1, upper: 1, label: "Sangat tinggi", guidance: "Lazim hanya pada audiens yang sudah sangat tersaring." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B4",
    structuralClass: "C1",
    decisionDomain: "D4",
    computeLayer: "L1",
    curriculumModule: 1,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "conversions": 420,
    "visitors": 14000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 10,
    xpRepeat: 2,
    masteryThreshold: 4,
    badgeId: "badge_conversion_rate",
    unlocksAfterModule: 1,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: true,
});
