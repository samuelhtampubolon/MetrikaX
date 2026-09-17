// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Bass_F(t): Bass Cumulative Adoption
 * Fungsi Adopsi Kumulatif Bass
 *
 * Stratum IX, phase B0, structural class C9, decision domain D7.
 * Engine rule: require calibration_source; always render at least three parameter scenarios
 */
export const bass_f: Relation = Object.freeze({
  formulaId: "bass_f",
  symbol: "Bass_F(t)",
  name: { id: "Fungsi Adopsi Kumulatif Bass", en: "Bass Cumulative Adoption" },
  inputs: Object.freeze(["bass_p", "bass_q", "time_t"]),
  output: "bass_f",
  structuralClass: "C9",
  resultBounds: null,
  expressionSource: "(1 - Math.exp(-(bass_p + bass_q) * time_t)) / (1 + (bass_q / bass_p) * Math.exp(-(bass_p + bass_q) * time_t))",
  latex: "F(t) = \\dfrac{1 - e^{-(p+q)t}}{1 + \\frac{q}{p} e^{-(p+q)t}}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const bass_p = num(env, "bass_p");
    const bass_q = num(env, "bass_q");
    const time_t = num(env, "time_t");
    return (1 - Math.exp(-(bass_p + bass_q) * time_t)) / (1 + (bass_q / bass_p) * Math.exp(-(bass_p + bass_q) * time_t));
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "bass_f",
    inputs: ["bass_p", "bass_q", "time_t"],
    denominators: ["bass_p"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.16, label: "Pengadopsi awal", guidance: "Kurva belum menanjak. Kesabaran diperlukan." },
    { lower: 0.16, upper: 0.5, label: "Penanjakan", guidance: "Fase pertumbuhan tercepat menjelang titik balik." },
    { lower: 0.5, upper: 0.84, label: "Mayoritas akhir", guidance: "Pertumbuhan mulai melambat." },
    { lower: 0.84, upper: 1, label: "Pengadopsi terakhir", guidance: "Pasar mendekati jenuh." },
  ]),
  taxonomy: Object.freeze({
    stratum: "IX",
    phase: "B0",
    structuralClass: "C9",
    decisionDomain: "D7",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "bass_p": 0.021,
    "bass_q": 0.38,
    "time_t": 6,
  }),
  publishesToGraph: false,
});
