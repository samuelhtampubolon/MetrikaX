// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * GRP: Gross Rating Points
 * Peringkat Kotor Terpaan
 *
 * Stratum VI, phase B2, structural class C4, decision domain D3.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const grp: Relation = Object.freeze({
  formulaId: "grp",
  symbol: "GRP",
  name: { id: "Peringkat Kotor Terpaan", en: "Gross Rating Points" },
  inputs: Object.freeze(["reach_pct", "frequency"]),
  output: "grp",
  structuralClass: "C4",
  expressionSource: "reach_pct * frequency",
  latex: "GRP = ReachPercent \\times Frequency",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const reach_pct = num(env, "reach_pct");
    const frequency = num(env, "frequency");
    return reach_pct * frequency;
  },
  inverses: Object.freeze({
    "reach_pct": (env: Env): number => {
    const result = num(env, "grp");
    const frequency = num(env, "frequency");
      return result / frequency;
    },
    "frequency": (env: Env): number => {
    const result = num(env, "grp");
    const reach_pct = num(env, "reach_pct");
      return result / reach_pct;
    },
  }),
  inverseSources: Object.freeze({
    "reach_pct": "result / frequency",
    "frequency": "result / reach_pct",
  }),
  guards: buildGuards({
    formulaId: "grp",
    inputs: ["reach_pct", "frequency"],
    denominators: ["frequency", "reach_pct"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 100, label: "Ringan", guidance: "Belum menjangkau seluruh sasaran sekali pun." },
    { lower: 100, upper: 300, label: "Sedang", guidance: "Rentang lazim kampanye taktis." },
    { lower: 300, upper: 800, label: "Berat", guidance: "Rentang lazim peluncuran besar." },
    { lower: 800, upper: 10000, label: "Sangat berat", guidance: "Periksa titik jenuh dan kelelahan audiens." },
  ]),
  taxonomy: Object.freeze({
    stratum: "VI",
    phase: "B2",
    structuralClass: "C4",
    decisionDomain: "D3",
    computeLayer: "L1",
    curriculumModule: 7,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "reach_pct": 62,
    "frequency": 4.8,
  }),
  publishesToGraph: false,
});
