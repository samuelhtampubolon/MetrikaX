// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Net_Reach: Net Reach
 * Jangkauan Bersih
 *
 * Stratum VI, phase B2, structural class C4, decision domain D3.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const net_reach: Relation = Object.freeze({
  formulaId: "net_reach",
  symbol: "Net_Reach",
  name: { id: "Jangkauan Bersih", en: "Net Reach" },
  inputs: Object.freeze(["gross_reach", "duplication"]),
  output: "net_reach",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "gross_reach - duplication",
  latex: "NetReach = GrossReach - Duplication",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const gross_reach = num(env, "gross_reach");
    const duplication = num(env, "duplication");
    return gross_reach - duplication;
  },
  inverses: Object.freeze({
    "gross_reach": (env: Env): number => {
    const result = num(env, "net_reach");
    const duplication = num(env, "duplication");
      return result + duplication;
    },
    "duplication": (env: Env): number => {
    const gross_reach = num(env, "gross_reach");
    const result = num(env, "net_reach");
      return gross_reach - result;
    },
  }),
  inverseSources: Object.freeze({
    "gross_reach": "result + duplication",
    "duplication": "gross_reach - result",
  }),
  guards: buildGuards({
    formulaId: "net_reach",
    inputs: ["gross_reach", "duplication"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

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
    "gross_reach": 1840000,
    "duplication": 520000,
  }),
  publishesToGraph: false,
});
