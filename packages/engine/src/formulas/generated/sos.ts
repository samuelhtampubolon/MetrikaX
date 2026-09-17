// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * SOS: Share of Search
 * Pangsa Pencarian
 *
 * Stratum I, phase B2, structural class C1, decision domain D3.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const sos: Relation = Object.freeze({
  formulaId: "sos",
  symbol: "SOS",
  name: { id: "Pangsa Pencarian", en: "Share of Search" },
  inputs: Object.freeze(["brand_searches", "category_searches"]),
  output: "sos",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "brand_searches / category_searches",
  latex: "SOS = \\dfrac{BrandSearches}{CategorySearches}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const brand_searches = num(env, "brand_searches");
    const category_searches = num(env, "category_searches");
    return brand_searches / category_searches;
  },
  inverses: Object.freeze({
    "brand_searches": (env: Env): number => {
    const result = num(env, "sos");
    const category_searches = num(env, "category_searches");
      return result * category_searches;
    },
    "category_searches": (env: Env): number => {
    const brand_searches = num(env, "brand_searches");
    const result = num(env, "sos");
      return brand_searches / result;
    },
  }),
  inverseSources: Object.freeze({
    "brand_searches": "result * category_searches",
    "category_searches": "brand_searches / result",
  }),
  guards: buildGuards({
    formulaId: "sos",
    inputs: ["brand_searches", "category_searches"],
    denominators: ["category_searches", "sos"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.05, label: "Rendah", guidance: "Permintaan bermerek belum terbentuk." },
    { lower: 0.05, upper: 0.2, label: "Bertumbuh", guidance: "Merek mulai dicari secara langsung." },
    { lower: 0.2, upper: 0.45, label: "Kuat", guidance: "Permintaan bermerek menopang penjualan." },
    { lower: 0.45, upper: 1, label: "Sangat kuat", guidance: "Merek nyaris identik dengan kategori." },
  ]),
  pitfallCount: 3,
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
    "brand_searches": 27000,
    "category_searches": 310000,
  }),
  publishesToGraph: false,
});
