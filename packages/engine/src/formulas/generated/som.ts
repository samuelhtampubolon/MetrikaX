// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * SOM: Serviceable Obtainable Market
 * Pasar yang Dapat Diraih
 *
 * Stratum VII, phase B0, structural class C4, decision domain D7.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const som: Relation = Object.freeze({
  formulaId: "som",
  symbol: "SOM",
  name: { id: "Pasar yang Dapat Diraih", en: "Serviceable Obtainable Market" },
  inputs: Object.freeze(["sam", "capture_percent"]),
  output: "som",
  structuralClass: "C4",
  expressionSource: "sam * (capture_percent / 100)",
  latex: "SOM = SAM \\times CapturePercent",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const sam = num(env, "sam");
    const capture_percent = num(env, "capture_percent");
    return sam * (capture_percent / 100);
  },
  inverses: Object.freeze({
    "sam": (env: Env): number => {
    const result = num(env, "som");
    const capture_percent = num(env, "capture_percent");
      return result / (capture_percent / 100);
    },
    "capture_percent": (env: Env): number => {
    const result = num(env, "som");
    const sam = num(env, "sam");
      return (result / sam) * 100;
    },
  }),
  inverseSources: Object.freeze({
    "sam": "result / (capture_percent / 100)",
    "capture_percent": "(result / sam) * 100",
  }),
  guards: buildGuards({
    formulaId: "som",
    inputs: ["sam", "capture_percent"],
    denominators: ["sam"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "VII",
    phase: "B0",
    structuralClass: "C4",
    decisionDomain: "D7",
    computeLayer: "L4",
    curriculumModule: 7,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "sam": 98154000000,
    "capture_percent": 8,
  }),
  publishesToGraph: false,
});
