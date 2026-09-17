// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * FMEA_RPN: FMEA Risk Priority Number
 * Angka Prioritas Risiko FMEA
 *
 * Stratum X, phase B8, structural class C4, decision domain D1.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const fmea_rpn: Relation = Object.freeze({
  formulaId: "fmea_rpn",
  symbol: "FMEA_RPN",
  name: { id: "Angka Prioritas Risiko FMEA", en: "FMEA Risk Priority Number" },
  inputs: Object.freeze(["severity", "occurrence", "detection"]),
  output: "fmea_rpn",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "severity * occurrence * detection",
  latex: "RPN = Severity \\times Occurrence \\times Detection",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const severity = num(env, "severity");
    const occurrence = num(env, "occurrence");
    const detection = num(env, "detection");
    return severity * occurrence * detection;
  },
  inverses: Object.freeze({
    "severity": (env: Env): number => {
    const result = num(env, "fmea_rpn");
    const occurrence = num(env, "occurrence");
    const detection = num(env, "detection");
      return result / (occurrence * detection);
    },
    "occurrence": (env: Env): number => {
    const result = num(env, "fmea_rpn");
    const severity = num(env, "severity");
    const detection = num(env, "detection");
      return result / (severity * detection);
    },
    "detection": (env: Env): number => {
    const result = num(env, "fmea_rpn");
    const severity = num(env, "severity");
    const occurrence = num(env, "occurrence");
      return result / (severity * occurrence);
    },
  }),
  inverseSources: Object.freeze({
    "severity": "result / (occurrence * detection)",
    "occurrence": "result / (severity * detection)",
    "detection": "result / (severity * occurrence)",
  }),
  guards: buildGuards({
    formulaId: "fmea_rpn",
    inputs: ["severity", "occurrence", "detection"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 1, upper: 50, label: "Rendah", guidance: "Pemantauan rutin memadai." },
    { lower: 50, upper: 100, label: "Sedang", guidance: "Rencana mitigasi perlu disiapkan." },
    { lower: 100, upper: 200, label: "Tinggi", guidance: "Tindakan perbaikan diperlukan." },
    { lower: 200, upper: 1000, label: "Kritis", guidance: "Hentikan dan perbaiki sebelum melanjutkan." },
  ]),
  taxonomy: Object.freeze({
    stratum: "X",
    phase: "B8",
    structuralClass: "C4",
    decisionDomain: "D1",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "severity": 8,
    "occurrence": 4,
    "detection": 6,
  }),
  publishesToGraph: false,
});
