// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Bounce_Rate: Bounce Rate
 * Tingkat Pentalan
 *
 * Stratum I, phase B3, structural class C1, decision domain D4.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const bounce_rate: Relation = Object.freeze({
  formulaId: "bounce_rate",
  symbol: "Bounce_Rate",
  name: { id: "Tingkat Pentalan", en: "Bounce Rate" },
  inputs: Object.freeze(["single_page_sessions", "sessions"]),
  output: "bounce_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "single_page_sessions / sessions",
  latex: "BR = \\dfrac{SinglePageSessions}{TotalSessions}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const single_page_sessions = num(env, "single_page_sessions");
    const sessions = num(env, "sessions");
    return single_page_sessions / sessions;
  },
  inverses: Object.freeze({
    "single_page_sessions": (env: Env): number => {
    const result = num(env, "bounce_rate");
    const sessions = num(env, "sessions");
      return result * sessions;
    },
    "sessions": (env: Env): number => {
    const single_page_sessions = num(env, "single_page_sessions");
    const result = num(env, "bounce_rate");
      return single_page_sessions / result;
    },
  }),
  inverseSources: Object.freeze({
    "single_page_sessions": "result * sessions",
    "sessions": "single_page_sessions / result",
  }),
  guards: buildGuards({
    formulaId: "bounce_rate",
    inputs: ["single_page_sessions", "sessions"],
    denominators: ["bounce_rate", "sessions"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.3, label: "Sangat rendah", guidance: "Periksa pemasangan ganda kode pelacak." },
    { lower: 0.3, upper: 0.55, label: "Baik", guidance: "Halaman mendorong penjelajahan lanjutan." },
    { lower: 0.55, upper: 0.75, label: "Wajar", guidance: "Rentang lazim halaman arahan." },
    { lower: 0.75, upper: 1, label: "Tinggi", guidance: "Kecocokan kata kunci dan isi halaman perlu diperiksa." },
  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B3",
    structuralClass: "C1",
    decisionDomain: "D4",
    computeLayer: "L1",
    curriculumModule: 1,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "single_page_sessions": 6800,
    "sessions": 11000,
  }),
  publishesToGraph: false,
});
