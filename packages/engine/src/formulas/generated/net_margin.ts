// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Net_Margin: Net Margin
 * Marjin Bersih
 *
 * Stratum III, phase B5, structural class C1, decision domain D2.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const net_margin: Relation = Object.freeze({
  formulaId: "net_margin",
  symbol: "Net_Margin",
  name: { id: "Marjin Bersih", en: "Net Margin" },
  inputs: Object.freeze(["net_profit", "revenue"]),
  output: "net_margin",
  structuralClass: "C1",
  expressionSource: "net_profit / revenue",
  latex: "NM = \\dfrac{NetProfit}{Revenue}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const net_profit = num(env, "net_profit");
    const revenue = num(env, "revenue");
    return net_profit / revenue;
  },
  inverses: Object.freeze({
    "net_profit": (env: Env): number => {
    const result = num(env, "net_margin");
    const revenue = num(env, "revenue");
      return result * revenue;
    },
    "revenue": (env: Env): number => {
    const net_profit = num(env, "net_profit");
    const result = num(env, "net_margin");
      return net_profit / result;
    },
  }),
  inverseSources: Object.freeze({
    "net_profit": "result * revenue",
    "revenue": "net_profit / result",
  }),
  guards: buildGuards({
    formulaId: "net_margin",
    inputs: ["net_profit", "revenue"],
    denominators: ["net_margin", "revenue"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1, upper: 0, label: "Rugi", guidance: "Biaya melampaui pendapatan." },
    { lower: 0, upper: 0.05, label: "Tipis", guidance: "Sedikit ruang bagi kesalahan." },
    { lower: 0.05, upper: 0.15, label: "Sehat", guidance: "Rentang lazim usaha mapan." },
    { lower: 0.15, upper: 1, label: "Sangat sehat", guidance: "Periksa apakah investasi pertumbuhan terlalu ditahan." },
  ]),
  taxonomy: Object.freeze({
    stratum: "III",
    phase: "B5",
    structuralClass: "C1",
    decisionDomain: "D2",
    computeLayer: "L1",
    curriculumModule: 3,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "net_profit": 16650000,
    "revenue": 185000000,
  }),
  publishesToGraph: false,
});
