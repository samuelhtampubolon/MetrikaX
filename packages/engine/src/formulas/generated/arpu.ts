// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * ARPU: Average Revenue per User
 * Pendapatan Rata-rata per Pengguna
 *
 * Stratum I, phase B5, structural class C2, decision domain D5.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const arpu: Relation = Object.freeze({
  formulaId: "arpu",
  symbol: "ARPU",
  name: { id: "Pendapatan Rata-rata per Pengguna", en: "Average Revenue per User" },
  inputs: Object.freeze(["revenue", "users"]),
  output: "arpu",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "revenue / users",
  latex: "ARPU = \\dfrac{Revenue}{Users}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const revenue = num(env, "revenue");
    const users = num(env, "users");
    return revenue / users;
  },
  inverses: Object.freeze({
    "revenue": (env: Env): number => {
    const arpu = num(env, "arpu");
    const users = num(env, "users");
      return arpu * users;
    },
    "users": (env: Env): number => {
    const revenue = num(env, "revenue");
    const arpu = num(env, "arpu");
      return revenue / arpu;
    },
  }),
  inverseSources: Object.freeze({
    "revenue": "arpu * users",
    "users": "revenue / arpu",
  }),
  guards: buildGuards({
    formulaId: "arpu",
    inputs: ["revenue", "users"],
    denominators: ["arpu", "users"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B5",
    structuralClass: "C2",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 2,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "revenue": 185000000,
    "users": 52000,
  }),
  publishesToGraph: true,
});
