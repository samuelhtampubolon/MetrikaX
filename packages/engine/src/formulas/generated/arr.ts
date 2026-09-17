// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * ARR: Annual Recurring Revenue
 * Pendapatan Berulang Tahunan
 *
 * Stratum III, phase B5, structural class C4, decision domain D8.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const arr: Relation = Object.freeze({
  formulaId: "arr",
  symbol: "ARR",
  name: { id: "Pendapatan Berulang Tahunan", en: "Annual Recurring Revenue" },
  inputs: Object.freeze(["mrr"]),
  output: "arr",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "mrr * 12",
  latex: "ARR = MRR \\times 12",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const mrr = num(env, "mrr");
    return mrr * 12;
  },
  inverses: Object.freeze({
    "mrr": (env: Env): number => {
    const result = num(env, "arr");
      return result / 12;
    },
  }),
  inverseSources: Object.freeze({
    "mrr": "result / 12",
  }),
  guards: buildGuards({
    formulaId: "arr",
    inputs: ["mrr"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "III",
    phase: "B5",
    structuralClass: "C4",
    decisionDomain: "D8",
    computeLayer: "L3",
    curriculumModule: 4,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "mrr": 173900000,
  }),
  publishesToGraph: false,
});
