// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * MQL_to_SQL_Rate: MQL to SQL Rate
 * Tingkat MQL ke SQL
 *
 * Stratum I, phase B3, structural class C1, decision domain D6.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const mql_to_sql_rate: Relation = Object.freeze({
  formulaId: "mql_to_sql_rate",
  symbol: "MQL_to_SQL_Rate",
  name: { id: "Tingkat MQL ke SQL", en: "MQL to SQL Rate" },
  inputs: Object.freeze(["sql", "mql"]),
  output: "mql_to_sql_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "sql / mql",
  latex: "M2S = \\dfrac{SQL}{MQL}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const sql = num(env, "sql");
    const mql = num(env, "mql");
    return sql / mql;
  },
  inverses: Object.freeze({
    "sql": (env: Env): number => {
    const result = num(env, "mql_to_sql_rate");
    const mql = num(env, "mql");
      return result * mql;
    },
    "mql": (env: Env): number => {
    const sql = num(env, "sql");
    const result = num(env, "mql_to_sql_rate");
      return sql / result;
    },
  }),
  inverseSources: Object.freeze({
    "sql": "result * mql",
    "mql": "sql / result",
  }),
  guards: buildGuards({
    formulaId: "mql_to_sql_rate",
    inputs: ["sql", "mql"],
    denominators: ["mql", "mql_to_sql_rate"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.1, label: "Rendah", guidance: "Kriteria penilaian pemasaran terlalu longgar." },
    { lower: 0.1, upper: 0.3, label: "Wajar", guidance: "Rentang lazim penjualan berbasis prospek." },
    { lower: 0.3, upper: 0.6, label: "Baik", guidance: "Keselarasan pemasaran dan penjualan kuat." },
    { lower: 0.6, upper: 1, label: "Sangat tinggi", guidance: "Periksa apakah kriteria MQL terlalu ketat sehingga volume hilang." },
  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B3",
    structuralClass: "C1",
    decisionDomain: "D6",
    computeLayer: "L1",
    curriculumModule: 1,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "sql": 168,
    "mql": 840,
  }),
  publishesToGraph: false,
});
