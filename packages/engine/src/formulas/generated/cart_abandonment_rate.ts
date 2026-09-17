// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Cart_Abandonment_Rate: Cart Abandonment Rate
 * Tingkat Pengabaian Keranjang
 *
 * Stratum I, phase B4, structural class C1, decision domain D4.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const cart_abandonment_rate: Relation = Object.freeze({
  formulaId: "cart_abandonment_rate",
  symbol: "Cart_Abandonment_Rate",
  name: { id: "Tingkat Pengabaian Keranjang", en: "Cart Abandonment Rate" },
  inputs: Object.freeze(["carts_created", "carts_purchased"]),
  output: "cart_abandonment_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "1 - (carts_purchased / carts_created)",
  latex: "CAR = 1 - \\dfrac{CartsPurchased}{CartsCreated}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const carts_purchased = num(env, "carts_purchased");
    const carts_created = num(env, "carts_created");
    return 1 - (carts_purchased / carts_created);
  },
  inverses: Object.freeze({
    "carts_purchased": (env: Env): number => {
    const carts_created = num(env, "carts_created");
    const result = num(env, "cart_abandonment_rate");
      return carts_created * (1 - result);
    },
    "carts_created": (env: Env): number => {
    const carts_purchased = num(env, "carts_purchased");
    const result = num(env, "cart_abandonment_rate");
      return carts_purchased / (1 - result);
    },
  }),
  inverseSources: Object.freeze({
    "carts_purchased": "carts_created * (1 - result)",
    "carts_created": "carts_purchased / (1 - result)",
  }),
  guards: buildGuards({
    formulaId: "cart_abandonment_rate",
    inputs: ["carts_created", "carts_purchased"],
    denominators: ["carts_created"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.5, label: "Sangat baik", guidance: "Alur pembayaran sangat mulus." },
    { lower: 0.5, upper: 0.7, label: "Baik", guidance: "Di bawah rata rata industri." },
    { lower: 0.7, upper: 0.85, label: "Wajar", guidance: "Rentang lazim ritel daring." },
    { lower: 0.85, upper: 1, label: "Kritis", guidance: "Periksa biaya kirim tersembunyi dan kewajiban membuat akun." },
  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B4",
    structuralClass: "C1",
    decisionDomain: "D4",
    computeLayer: "L1",
    curriculumModule: 1,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "carts_created": 9500,
    "carts_purchased": 1900,
  }),
  publishesToGraph: false,
});
