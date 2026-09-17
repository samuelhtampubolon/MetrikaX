// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Penetration_Rate: Penetration Rate
 * Tingkat Penetrasi
 *
 * Stratum I, phase B0, structural class C1, decision domain D7.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const penetration_rate: Relation = Object.freeze({
  formulaId: "penetration_rate",
  symbol: "Penetration_Rate",
  name: { id: "Tingkat Penetrasi", en: "Penetration Rate" },
  inputs: Object.freeze(["customers", "tam_population"]),
  output: "penetration_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "customers / tam_population",
  latex: "PR = \\dfrac{Customers}{TAMPopulation}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const customers = num(env, "customers");
    const tam_population = num(env, "tam_population");
    return customers / tam_population;
  },
  inverses: Object.freeze({
    "customers": (env: Env): number => {
    const result = num(env, "penetration_rate");
    const tam_population = num(env, "tam_population");
      return result * tam_population;
    },
    "tam_population": (env: Env): number => {
    const customers = num(env, "customers");
    const result = num(env, "penetration_rate");
      return customers / result;
    },
  }),
  inverseSources: Object.freeze({
    "customers": "result * tam_population",
    "tam_population": "customers / result",
  }),
  guards: buildGuards({
    formulaId: "penetration_rate",
    inputs: ["customers", "tam_population"],
    denominators: ["penetration_rate", "tam_population"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.01, label: "Awal", guidance: "Pasar masih hampir seluruhnya belum tersentuh." },
    { lower: 0.01, upper: 0.1, label: "Bertumbuh", guidance: "Ruang pertumbuhan masih sangat besar." },
    { lower: 0.1, upper: 0.35, label: "Matang awal", guidance: "Pertumbuhan mulai menuntut biaya akuisisi lebih tinggi." },
    { lower: 0.35, upper: 1, label: "Jenuh", guidance: "Prioritas bergeser ke retensi dan perluasan nilai per pelanggan." },
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
    "customers": 6200,
    "tam_population": 410000,
  }),
  publishesToGraph: false,
});
