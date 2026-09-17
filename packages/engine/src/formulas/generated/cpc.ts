// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CPC: Cost per Click
 * Biaya per Klik
 *
 * Stratum I, phase B3, structural class C2, decision domain D3.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const cpc: Relation = Object.freeze({
  formulaId: "cpc",
  symbol: "CPC",
  name: { id: "Biaya per Klik", en: "Cost per Click" },
  inputs: Object.freeze(["spend", "clicks"]),
  output: "cpc",
  structuralClass: "C2",
  expressionSource: "spend / clicks",
  latex: "CPC = \\dfrac{Spend}{Clicks}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const spend = num(env, "spend");
    const clicks = num(env, "clicks");
    return spend / clicks;
  },
  inverses: Object.freeze({
    "spend": (env: Env): number => {
    const result = num(env, "cpc");
    const clicks = num(env, "clicks");
      return result * clicks;
    },
    "clicks": (env: Env): number => {
    const spend = num(env, "spend");
    const result = num(env, "cpc");
      return spend / result;
    },
  }),
  inverseSources: Object.freeze({
    "spend": "result * clicks",
    "clicks": "spend / result",
  }),
  guards: buildGuards({
    formulaId: "cpc",
    inputs: ["spend", "clicks"],
    denominators: ["clicks", "cpc"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B3",
    structuralClass: "C2",
    decisionDomain: "D3",
    computeLayer: "L1",
    curriculumModule: 2,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "spend": 24000000,
    "clicks": 41600,
  }),
  publishesToGraph: false,
});
