// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Market_Share: Market Share
 * Pangsa Pasar
 *
 * Stratum I, phase B0, structural class C1, decision domain D7.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const market_share: Relation = Object.freeze({
  formulaId: "market_share",
  symbol: "Market_Share",
  name: { id: "Pangsa Pasar", en: "Market Share" },
  inputs: Object.freeze(["company_sales", "market_sales"]),
  output: "company_share",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "company_sales / market_sales",
  latex: "MS = \\dfrac{CompanySales}{MarketSales}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const company_sales = num(env, "company_sales");
    const market_sales = num(env, "market_sales");
    return company_sales / market_sales;
  },
  inverses: Object.freeze({
    "company_sales": (env: Env): number => {
    const company_share = num(env, "company_share");
    const market_sales = num(env, "market_sales");
      return company_share * market_sales;
    },
    "market_sales": (env: Env): number => {
    const company_sales = num(env, "company_sales");
    const company_share = num(env, "company_share");
      return company_sales / company_share;
    },
  }),
  inverseSources: Object.freeze({
    "company_sales": "company_share * market_sales",
    "market_sales": "company_sales / company_share",
  }),
  guards: buildGuards({
    formulaId: "market_share",
    inputs: ["company_sales", "market_sales"],
    denominators: ["company_share", "market_sales"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.05, label: "Pemain kecil", guidance: "Strategi ceruk lazimnya lebih tepat daripada konfrontasi langsung." },
    { lower: 0.05, upper: 0.15, label: "Penantang", guidance: "Pertumbuhan pangsa masih mungkin melalui diferensiasi." },
    { lower: 0.15, upper: 0.4, label: "Pemimpin bersama", guidance: "Perhatikan pangsa relatif terhadap pesaing terbesar." },
    { lower: 0.4, upper: 1, label: "Dominan", guidance: "Pertumbuhan lebih mudah diperoleh dari perluasan kategori." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B0",
    structuralClass: "C1",
    decisionDomain: "D7",
    computeLayer: "L1",
    curriculumModule: 7,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "company_sales": 4200000000,
    "market_sales": 38000000000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 10,
    xpRepeat: 2,
    masteryThreshold: 4,
    badgeId: "badge_market_share",
    unlocksAfterModule: 6,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: true,
});
