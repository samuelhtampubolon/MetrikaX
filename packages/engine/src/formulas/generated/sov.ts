// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * SOV: Share of Voice
 * Pangsa Suara
 *
 * Stratum I, phase B2, structural class C1, decision domain D3.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const sov: Relation = Object.freeze({
  formulaId: "sov",
  symbol: "SOV",
  name: { id: "Pangsa Suara", en: "Share of Voice" },
  inputs: Object.freeze(["brand_mentions", "market_mentions"]),
  output: "sov",
  structuralClass: "C1",
  expressionSource: "brand_mentions / market_mentions",
  latex: "SOV = \\dfrac{BrandMentions}{MarketMentions}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const brand_mentions = num(env, "brand_mentions");
    const market_mentions = num(env, "market_mentions");
    return brand_mentions / market_mentions;
  },
  inverses: Object.freeze({
    "brand_mentions": (env: Env): number => {
    const result = num(env, "sov");
    const market_mentions = num(env, "market_mentions");
      return result * market_mentions;
    },
    "market_mentions": (env: Env): number => {
    const brand_mentions = num(env, "brand_mentions");
    const result = num(env, "sov");
      return brand_mentions / result;
    },
  }),
  inverseSources: Object.freeze({
    "brand_mentions": "result * market_mentions",
    "market_mentions": "brand_mentions / result",
  }),
  guards: buildGuards({
    formulaId: "sov",
    inputs: ["brand_mentions", "market_mentions"],
    denominators: ["market_mentions", "sov"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.05, label: "Nyaris tidak terdengar", guidance: "Merek belum masuk percakapan kategori." },
    { lower: 0.05, upper: 0.15, label: "Hadir", guidance: "Merek dikenal namun bukan rujukan utama." },
    { lower: 0.15, upper: 0.35, label: "Menonjol", guidance: "Merek menjadi salah satu rujukan kategori." },
    { lower: 0.35, upper: 1, label: "Dominan", guidance: "Periksa apakah sebagian sebutan bernada negatif." },
  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B2",
    structuralClass: "C1",
    decisionDomain: "D3",
    computeLayer: "L1",
    curriculumModule: 7,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "brand_mentions": 4800,
    "market_mentions": 52000,
  }),
  publishesToGraph: false,
});
