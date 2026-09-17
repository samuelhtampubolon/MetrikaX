// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Opportunity_Score: Opportunity Score
 * Skor Peluang
 *
 * Stratum VIII, phase B1, structural class C3, decision domain D1.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const opportunity_score: Relation = Object.freeze({
  formulaId: "opportunity_score",
  symbol: "Opportunity_Score",
  name: { id: "Skor Peluang", en: "Opportunity Score" },
  inputs: Object.freeze(["importance", "satisfaction"]),
  output: "opportunity_score",
  structuralClass: "C3",
  resultBounds: null,
  expressionSource: "importance + Math.max(0, importance - satisfaction)",
  latex: "OS = Importance + \\max(0,\\; Importance - Satisfaction)",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const importance = num(env, "importance");
    const satisfaction = num(env, "satisfaction");
    return importance + Math.max(0, importance - satisfaction);
  },
  inverses: Object.freeze({
    "satisfaction": (env: Env): number => {
    const importance = num(env, "importance");
    const result = num(env, "opportunity_score");
      return 2 * importance - result;
    },
  }),
  inverseSources: Object.freeze({
    "satisfaction": "2 * importance - result",
  }),
  guards: buildGuards({
    formulaId: "opportunity_score",
    inputs: ["importance", "satisfaction"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 10, label: "Terlayani berlebih", guidance: "Investasi lanjutan tidak akan menambah nilai." },
    { lower: 10, upper: 12, label: "Terlayani wajar", guidance: "Pertahankan tanpa investasi besar." },
    { lower: 12, upper: 15, label: "Peluang", guidance: "Kesenjangan nyata antara kepentingan dan kepuasan." },
    { lower: 15, upper: 20, label: "Peluang besar", guidance: "Prioritas utama pengembangan." },
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
    "importance": 8.6,
    "satisfaction": 4.2,
  }),
  publishesToGraph: false,
});
