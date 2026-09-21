// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Gross_Margin: Gross Margin
 * Marjin Kotor
 *
 * Stratum III, phase B5, structural class C1, decision domain D2.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const gross_margin: Relation = Object.freeze({
  formulaId: "gross_margin",
  symbol: "Gross_Margin",
  name: { id: "Marjin Kotor", en: "Gross Margin" },
  inputs: Object.freeze(["revenue", "cogs"]),
  output: "gross_margin",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "(revenue - cogs) / revenue",
  latex: "GM = \\dfrac{Revenue - COGS}{Revenue}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const revenue = num(env, "revenue");
    const cogs = num(env, "cogs");
    return (revenue - cogs) / revenue;
  },
  inverses: Object.freeze({
    "cogs": (env: Env): number => {
    const revenue = num(env, "revenue");
    const gross_margin = num(env, "gross_margin");
      return revenue * (1 - gross_margin);
    },
    "revenue": (env: Env): number => {
    const cogs = num(env, "cogs");
    const gross_margin = num(env, "gross_margin");
      return cogs / (1 - gross_margin);
    },
  }),
  inverseSources: Object.freeze({
    "cogs": "revenue * (1 - gross_margin)",
    "revenue": "cogs / (1 - gross_margin)",
  }),
  guards: buildGuards({
    formulaId: "gross_margin",
    inputs: ["revenue", "cogs"],
    denominators: ["revenue"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.2, label: "Tipis", guidance: "Model padat biaya langsung. Ruang pemasaran sangat terbatas." },
    { lower: 0.2, upper: 0.45, label: "Sedang", guidance: "Lazim pada ritel dan manufaktur." },
    { lower: 0.45, upper: 0.75, label: "Tebal", guidance: "Ruang investasi pemasaran luas." },
    { lower: 0.75, upper: 1, label: "Sangat tebal", guidance: "Lazim pada perangkat lunak dan konten digital." },
  ]),
  pitfallCount: 3,
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
    "revenue": 185000000,
    "cogs": 74000000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 20,
    xpRepeat: 4,
    masteryThreshold: 4,
    badgeId: "badge_gross_margin",
    unlocksAfterModule: 2,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: true,
});
