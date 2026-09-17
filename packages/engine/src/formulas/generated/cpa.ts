// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CPA: Cost per Acquisition
 * Biaya per Akuisisi
 *
 * Stratum I, phase B4, structural class C2, decision domain D4.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const cpa: Relation = Object.freeze({
  formulaId: "cpa",
  symbol: "CPA",
  name: { id: "Biaya per Akuisisi", en: "Cost per Acquisition" },
  inputs: Object.freeze(["spend", "acquisitions"]),
  output: "cpa",
  structuralClass: "C2",
  expressionSource: "spend / acquisitions",
  latex: "CPA = \\dfrac{Spend}{Acquisitions}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const spend = num(env, "spend");
    const acquisitions = num(env, "acquisitions");
    return spend / acquisitions;
  },
  inverses: Object.freeze({
    "spend": (env: Env): number => {
    const result = num(env, "cpa");
    const acquisitions = num(env, "acquisitions");
      return result * acquisitions;
    },
    "acquisitions": (env: Env): number => {
    const spend = num(env, "spend");
    const result = num(env, "cpa");
      return spend / result;
    },
  }),
  inverseSources: Object.freeze({
    "spend": "result * acquisitions",
    "acquisitions": "spend / result",
  }),
  guards: buildGuards({
    formulaId: "cpa",
    inputs: ["spend", "acquisitions"],
    denominators: ["acquisitions", "cpa"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B4",
    structuralClass: "C2",
    decisionDomain: "D4",
    computeLayer: "L1",
    curriculumModule: 2,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "spend": 24000000,
    "acquisitions": 312,
  }),
  publishesToGraph: false,
});
