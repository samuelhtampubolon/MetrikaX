// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation, FormulaResult } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';
import { vw_intersection } from '../../helpers/index.ts';

/**
 * Van_Westendorp_Optimal: Van Westendorp Optimal Price Point
 * Titik Harga Optimal Van Westendorp
 *
 * Stratum VIII, phase B1, structural class C10, decision domain D2.
 * Engine rule: run sign-change scan before solving; report all roots found, never silently pick one
 */
export const van_westendorp: Relation = Object.freeze({
  formulaId: "van_westendorp",
  symbol: "Van_Westendorp_Optimal",
  name: { id: "Titik Harga Optimal Van Westendorp", en: "Van Westendorp Optimal Price Point" },
  inputs: Object.freeze(["too_cheap", "cheap", "expensive", "too_expensive"]),
  output: null,
  structuralClass: "C10",
  resultBounds: null,
  expressionSource: "vw_intersection(too_cheap, cheap, expensive, too_expensive)",
  latex: "OPP = \\{P : F_{TooCheap}(P) = F_{TooExpensive}(P)\\}",
  resultShape: "composite",
  forward: (env: Env): FormulaResult => {
    const too_cheap = num(env, "too_cheap");
    const cheap = num(env, "cheap");
    const expensive = num(env, "expensive");
    const too_expensive = num(env, "too_expensive");
    return vw_intersection(too_cheap, cheap, expensive, too_expensive);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "van_westendorp",
    inputs: ["too_cheap", "cheap", "expensive", "too_expensive"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "VIII",
    phase: "B1",
    structuralClass: "C10",
    decisionDomain: "D2",
    computeLayer: "L1",
    curriculumModule: 8,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "too_cheap": 45000,
    "cheap": 78000,
    "expensive": 135000,
    "too_expensive": 195000,
  }),
  publishesToGraph: false,
});
