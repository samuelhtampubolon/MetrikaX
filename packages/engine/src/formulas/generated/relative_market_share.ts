// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Relative_Market_Share: Relative Market Share
 * Pangsa Pasar Relatif
 *
 * Stratum IV, phase B0, structural class C2, decision domain D7.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const relative_market_share: Relation = Object.freeze({
  formulaId: "relative_market_share",
  symbol: "Relative_Market_Share",
  name: { id: "Pangsa Pasar Relatif", en: "Relative Market Share" },
  inputs: Object.freeze(["company_share", "largest_competitor_share"]),
  output: "relative_market_share",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "company_share / largest_competitor_share",
  latex: "RMS = \\dfrac{CompanyShare}{LargestCompetitorShare}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const company_share = num(env, "company_share");
    const largest_competitor_share = num(env, "largest_competitor_share");
    return company_share / largest_competitor_share;
  },
  inverses: Object.freeze({
    "company_share": (env: Env): number => {
    const result = num(env, "relative_market_share");
    const largest_competitor_share = num(env, "largest_competitor_share");
      return result * largest_competitor_share;
    },
    "largest_competitor_share": (env: Env): number => {
    const company_share = num(env, "company_share");
    const result = num(env, "relative_market_share");
      return company_share / result;
    },
  }),
  inverseSources: Object.freeze({
    "company_share": "result * largest_competitor_share",
    "largest_competitor_share": "company_share / result",
  }),
  guards: buildGuards({
    formulaId: "relative_market_share",
    inputs: ["company_share", "largest_competitor_share"],
    denominators: ["largest_competitor_share", "relative_market_share"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.5, label: "Tertinggal jauh", guidance: "Posisi pengikut. Skala ekonomi berpihak pada pesaing." },
    { lower: 0.5, upper: 1, label: "Penantang", guidance: "Jarak masih dapat dikejar." },
    { lower: 1, upper: 2, label: "Pemimpin tipis", guidance: "Kepemimpinan belum aman." },
    { lower: 2, upper: 1000, label: "Pemimpin kuat", guidance: "Keunggulan biaya struktural lazimnya menyertai posisi ini." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "IV",
    phase: "B0",
    structuralClass: "C2",
    decisionDomain: "D7",
    computeLayer: "L2",
    curriculumModule: 7,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "company_share": 0.11,
    "largest_competitor_share": 0.29,
  }),
  publishesToGraph: false,
});
