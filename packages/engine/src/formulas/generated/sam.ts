// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * SAM: Serviceable Available Market
 * Pasar yang Dapat Dilayani
 *
 * Stratum VII, phase B0, structural class C4, decision domain D7.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const sam: Relation = Object.freeze({
  formulaId: "sam",
  symbol: "SAM",
  name: { id: "Pasar yang Dapat Dilayani", en: "Serviceable Available Market" },
  inputs: Object.freeze(["tam", "reachable_percent"]),
  output: "sam",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "tam * (reachable_percent / 100)",
  latex: "SAM = TAM \\times ReachablePercent",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const tam = num(env, "tam");
    const reachable_percent = num(env, "reachable_percent");
    return tam * (reachable_percent / 100);
  },
  inverses: Object.freeze({
    "tam": (env: Env): number => {
    const sam = num(env, "sam");
    const reachable_percent = num(env, "reachable_percent");
      return sam / (reachable_percent / 100);
    },
    "reachable_percent": (env: Env): number => {
    const sam = num(env, "sam");
    const tam = num(env, "tam");
      return (sam / tam) * 100;
    },
  }),
  inverseSources: Object.freeze({
    "tam": "sam / (reachable_percent / 100)",
    "reachable_percent": "(sam / tam) * 100",
  }),
  guards: buildGuards({
    formulaId: "sam",
    inputs: ["tam", "reachable_percent"],
    denominators: ["tam"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "VII",
    phase: "B0",
    structuralClass: "C4",
    decisionDomain: "D7",
    computeLayer: "L3",
    curriculumModule: 7,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "tam": 280440000000,
    "reachable_percent": 35,
  }),
  publishesToGraph: true,
});
