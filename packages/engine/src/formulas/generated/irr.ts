// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation, FormulaResult } from '../../types.ts';
import { num, vec } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';
import { irr_solve } from '../../helpers/index.ts';

/**
 * IRR: Internal Rate of Return
 * Tingkat Pengembalian Internal
 *
 * Stratum XI, phase B8, structural class C10, decision domain D8.
 * Engine rule: run sign-change scan before solving; report all roots found, never silently pick one
 */
export const irr: Relation = Object.freeze({
  formulaId: "irr",
  symbol: "IRR",
  name: { id: "Tingkat Pengembalian Internal", en: "Internal Rate of Return" },
  inputs: Object.freeze(["cash_flows", "investment_0"]),
  output: null,
  structuralClass: "C10",
  resultBounds: null,
  expressionSource: "irr_solve(cash_flows, investment_0)",
  latex: "IRR = \\{r : \\sum_{t=1}^{T} \\dfrac{CF_t}{(1+r)^t} - Investment_0 = 0\\}",
  resultShape: "composite",
  forward: (env: Env): FormulaResult => {
    const cash_flows = vec(env, "cash_flows");
    const investment_0 = num(env, "investment_0");
    return irr_solve(cash_flows, investment_0);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "irr",
    inputs: ["cash_flows", "investment_0"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1, upper: 0, label: "Negatif", guidance: "Proyek tidak mengembalikan modal." },
    { lower: 0, upper: 0.12, label: "Di bawah biaya modal", guidance: "Bandingkan dengan biaya modal sebelum menolak." },
    { lower: 0.12, upper: 0.3, label: "Baik", guidance: "Melampaui biaya modal pada sebagian besar konteks." },
    { lower: 0.3, upper: 10, label: "Sangat tinggi", guidance: "Periksa apakah arus kas terlalu optimistis." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "XI",
    phase: "B8",
    structuralClass: "C10",
    decisionDomain: "D8",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "cash_flows": [120000000,180000000,240000000,260000000,280000000],
    "investment_0": 480000000,
  }),
  publishesToGraph: false,
});
