/**
 * Core engine types, from engine.core_types in the specification.
 *
 * ADR-002: this package holds no import from React, the DOM or any browser API.
 */

import type { Period, UnitClass, ValueKind } from './variables/units.ts';
import type { Locale, LocalisedText } from './errors.ts';
import type { IrrResult } from './helpers/irr.ts';
import type { VwResult } from './helpers/vanWestendorp.ts';

export type VariableId = string;
export type FormulaId = string;

/** A magnitude is a scalar for most classes, an array for vector, an array of arrays for matrix. */
export type Magnitude = number | readonly number[] | readonly (readonly number[])[];

export type ValueOrigin = 'user' | 'derived' | 'assumed' | 'scenario';
export type Confidence = 'exact' | 'estimated' | 'assumed';

/**
 * Invariant: a Value with origin 'user' always has depth 0 and derivedBy null.
 * `assertValueInvariant` in graph/propagate.ts enforces it.
 */
export interface Value {
  readonly variableId: VariableId;
  readonly magnitude: Magnitude;
  readonly unitClass: UnitClass;
  readonly origin: ValueOrigin;
  readonly derivedBy: FormulaId | null;
  readonly derivedFrom: readonly VariableId[];
  readonly confidence: Confidence;
  readonly timestamp: string;
  /** Propagation generation. 0 for user input. */
  readonly depth: number;
  /** Period stamp, present for count-class and currency-class values. */
  readonly period?: Period;
}

export interface VariableConstraints {
  readonly min: number | null;
  readonly max: number | null;
  readonly decimals: number;
  readonly allowZero: boolean;
  readonly nullable: boolean;
}

export interface VariableDefinition {
  readonly id: VariableId;
  readonly label: LocalisedText;
  readonly unitClass: UnitClass;
  readonly valueKind: ValueKind;
  readonly constraints: VariableConstraints;
  readonly definition: string;
  readonly ui: {
    readonly widget: 'numeric_spinner' | 'vector_editor';
    readonly stepHint: string;
    readonly thousandSeparator: boolean;
    readonly suffix: string;
  };
  /**
   * True when codegen synthesised this variable as the result slot of a formula whose
   * `output.canonical_variable_id` is null in the specification. See DEVIATIONS.md, D-01.
   */
  readonly synthesised: boolean;
  /** The formula that produces this variable, when it is a result slot. */
  readonly producedBy: FormulaId | null;
}

/** The environment passed to a compiled expression: variable id to magnitude. */
export type Env = Readonly<Record<VariableId, Magnitude>>;

/**
 * Three relations return a structure rather than a number: IRR returns every root it found,
 * Van Westendorp returns four price points with their curves, and the QFD relation returns one
 * importance score per technical characteristic. They publish nothing to the variable graph, and
 * `resultShape` on the relation says which case applies.
 */
export type FormulaResult = Magnitude | IrrResult | VwResult;

export type GuardResult = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export interface Guard {
  readonly id: string;
  readonly describe: LocalisedText;
  readonly check: (env: Env) => GuardResult;
}

export type SolveDirection = 'forward' | 'inverse';

/**
 * A relation, not a function. Each knows how to solve for its output and for each input it can
 * isolate. This is the single design decision that turns a calculator into a solver.
 */
export interface Relation {
  readonly formulaId: FormulaId;
  readonly symbol: string;
  readonly name: LocalisedText;
  readonly inputs: readonly VariableId[];
  readonly output: VariableId | null;
  readonly structuralClass: string;
  /**
   * The range the result must stay inside, from the structural class. Class C1 is bounded by its
   * own signature; the bound is stated in the unit the expression produces, so a relation that
   * scales its quotient to a percentage is bounded by 100 rather than by 1.
   */
  readonly resultBounds: { readonly lower: number; readonly upper: number } | null;
  readonly expressionSource: string;
  readonly latex: string;
  /** Present when the forward result is a structure rather than a scalar (IRR, Van Westendorp). */
  readonly resultShape: 'scalar' | 'composite';
  readonly forward: (env: Env) => FormulaResult;
  readonly inverses: Readonly<Record<VariableId, (env: Env) => number>>;
  readonly inverseSources: Readonly<Record<VariableId, string>>;
  readonly guards: readonly Guard[];
  readonly interpretationBands: readonly InterpretationBand[];
  /**
   * How many failure modes the specification lists for this formula. The text itself lives in the
   * locale catalogue under formula.<id>.pitfall.<index>, so no component holds it inline.
   */
  readonly pitfallCount: number;
  readonly taxonomy: FormulaTaxonomy;
  readonly workedExample: Readonly<Record<VariableId, Magnitude>>;
  /** What this formula is worth, and what mastering it takes, from gamification. */
  readonly gamification: FormulaGamification;
  readonly publishesToGraph: boolean;
}

export interface FormulaGamification {
  readonly xpFirstSolve: number;
  readonly xpRepeat: number;
  /** Consecutive correct solves needed before this formula counts as mastered. */
  readonly masteryThreshold: number;
  readonly badgeId: string;
  readonly unlocksAfterModule: number;
  /** The challenge types the specification lists for this formula. */
  readonly challengeTypes: readonly string[];
}

export interface InterpretationBand {
  readonly lower: number;
  readonly upper: number;
  readonly label: string;
  readonly guidance: string;
}

export interface FormulaTaxonomy {
  readonly stratum: string;
  readonly phase: string;
  readonly structuralClass: string;
  readonly decisionDomain: string;
  readonly computeLayer: string;
  readonly curriculumModule: number;
  readonly dashboardTier: 'operational' | 'tactical' | 'strategic';
}

export interface DerivationStep {
  readonly formulaId: FormulaId;
  readonly direction: SolveDirection;
  readonly target: VariableId;
  readonly inputs: readonly VariableId[];
  readonly env: Env;
  readonly magnitude: Magnitude;
  readonly generation: number;
}

export interface BlockedRelation {
  readonly formulaId: FormulaId;
  readonly direction: SolveDirection;
  readonly target: VariableId | null;
  readonly reason: string;
  readonly detail: LocalisedText;
}

export interface Conflict {
  readonly variableId: VariableId;
  readonly userMagnitude: Magnitude;
  readonly derivedMagnitude: Magnitude;
  readonly formulaId: FormulaId;
  readonly inputs: readonly VariableId[];
  readonly relativeDifference: number;
  readonly detail: LocalisedText;
}

export interface PropagationResult {
  readonly derived: ReadonlyMap<VariableId, Value>;
  readonly trail: readonly DerivationStep[];
  readonly blocked: readonly BlockedRelation[];
  readonly conflicts: readonly Conflict[];
  readonly generations: number;
  /** Count of variables produced beyond the known set. */
  readonly reachable: number;
}

export interface Assumption {
  readonly variableId: VariableId;
  readonly magnitude: Magnitude;
  readonly statement: LocalisedText;
  readonly recordedAt: string;
}

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly locale: Locale;
  readonly currency: 'IDR' | 'USD' | 'EUR';
  readonly period: Period;
  readonly values: Readonly<Record<VariableId, Value>>;
  readonly assumptions: readonly Assumption[];
  readonly scenarios: readonly Scenario[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Scenario {
  readonly id: string;
  readonly name: string;
  readonly overrides: Readonly<Record<VariableId, number>>;
}

export function isScalar(magnitude: Magnitude): magnitude is number {
  return typeof magnitude === 'number';
}

export function isVector(magnitude: Magnitude): magnitude is readonly number[] {
  return Array.isArray(magnitude) && magnitude.every((entry) => typeof entry === 'number');
}
