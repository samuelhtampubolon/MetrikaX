// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * NDR: Net Dollar Retention
 * Retensi Pendapatan Bersih
 *
 * Stratum V, phase B6, structural class C3, decision domain D5.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const ndr: Relation = Object.freeze({
  formulaId: "ndr",
  symbol: "NDR",
  name: { id: "Retensi Pendapatan Bersih", en: "Net Dollar Retention" },
  inputs: Object.freeze(["start_mrr", "expansion_mrr", "contraction_mrr", "churned_mrr"]),
  output: "ndr",
  structuralClass: "C3",
  resultBounds: null,
  expressionSource: "(start_mrr + expansion_mrr - contraction_mrr - churned_mrr) / start_mrr",
  latex: "NDR = \\dfrac{StartMRR + Expansion - Contraction - Churn}{StartMRR}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const start_mrr = num(env, "start_mrr");
    const expansion_mrr = num(env, "expansion_mrr");
    const contraction_mrr = num(env, "contraction_mrr");
    const churned_mrr = num(env, "churned_mrr");
    return (start_mrr + expansion_mrr - contraction_mrr - churned_mrr) / start_mrr;
  },
  inverses: Object.freeze({
    "expansion_mrr": (env: Env): number => {
    const start_mrr = num(env, "start_mrr");
    const result = num(env, "ndr");
    const contraction_mrr = num(env, "contraction_mrr");
    const churned_mrr = num(env, "churned_mrr");
      return start_mrr * result - start_mrr + contraction_mrr + churned_mrr;
    },
    "contraction_mrr": (env: Env): number => {
    const start_mrr = num(env, "start_mrr");
    const expansion_mrr = num(env, "expansion_mrr");
    const churned_mrr = num(env, "churned_mrr");
    const result = num(env, "ndr");
      return start_mrr + expansion_mrr - churned_mrr - start_mrr * result;
    },
    "churned_mrr": (env: Env): number => {
    const start_mrr = num(env, "start_mrr");
    const expansion_mrr = num(env, "expansion_mrr");
    const contraction_mrr = num(env, "contraction_mrr");
    const result = num(env, "ndr");
      return start_mrr + expansion_mrr - contraction_mrr - start_mrr * result;
    },
  }),
  inverseSources: Object.freeze({
    "expansion_mrr": "start_mrr * result - start_mrr + contraction_mrr + churned_mrr",
    "contraction_mrr": "start_mrr + expansion_mrr - churned_mrr - start_mrr * result",
    "churned_mrr": "start_mrr + expansion_mrr - contraction_mrr - start_mrr * result",
  }),
  guards: buildGuards({
    formulaId: "ndr",
    inputs: ["start_mrr", "expansion_mrr", "contraction_mrr", "churned_mrr"],
    denominators: ["start_mrr"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.9, label: "Menyusut", guidance: "Basis pelanggan lama kehilangan nilai." },
    { lower: 0.9, upper: 1, label: "Stagnan", guidance: "Ekspansi belum menutup kebocoran." },
    { lower: 1, upper: 1.2, label: "Bertumbuh", guidance: "Pendapatan tumbuh tanpa pelanggan baru." },
    { lower: 1.2, upper: 10, label: "Sangat kuat", guidance: "Model ekspansi bekerja sangat baik." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B6",
    structuralClass: "C3",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 4,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "start_mrr": 173900000,
    "expansion_mrr": 14800000,
    "contraction_mrr": 2600000,
    "churned_mrr": 4200000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 45,
    xpRepeat: 9,
    masteryThreshold: 3,
    badgeId: "badge_ndr",
    unlocksAfterModule: 3,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
