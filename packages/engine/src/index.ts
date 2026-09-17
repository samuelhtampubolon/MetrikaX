/**
 * @metrika/engine
 *
 * ADR-002: this package holds all formula logic and imports nothing from React, the DOM or any
 * browser API. It is testable in Node, reusable in a future command line tool, and readable by a
 * reviewer who does not want to read interface code.
 */

export * from './types.ts';
export * from './errors.ts';
export * from './compute.ts';

export { RELATIONS, RELATION_LIST, FORMULA_COUNT } from './formulas/generated/index.ts';
export {
  VARIABLES,
  VARIABLE_DEFINITIONS,
  SPEC_VARIABLE_COUNT,
  SYNTHESISED_VARIABLE_COUNT,
} from './variables/generated/registry.ts';

export {
  UNIT_CLASSES,
  VALUE_KINDS,
  PERIODS,
  PERIODS_PER_YEAR,
  isUnitClass,
  isScalarClass,
  isCurrencyClass,
  carriesPeriodStamp,
  toleranceFor,
  convertExtensive,
  convertRateCompounded,
  type UnitClass,
  type ValueKind,
  type Period,
  type ConflictTolerance,
} from './variables/units.ts';

export {
  formatNumber,
  formatByUnitClass,
  ratioAsPercent,
  parseNumber,
  defaultDecimals,
  type FormatOptions,
} from './variables/format.ts';

export { buildGraph, requirementsFor, type RelationGraph } from './graph/build.ts';

export {
  propagate,
  userValues,
  assertValueInvariant,
  type PropagateOptions,
} from './graph/propagate.ts';

export {
  analyseUnderdetermination,
  type Frontier,
  type UnderdeterminationReport,
} from './graph/underdetermined.ts';

export {
  explainStep,
  explainValue,
  explainProvenance,
  explainTree,
  explainAssumptions,
  type ExplainOptions,
} from './graph/explain.ts';

export {
  buildGuards,
  checkGuards,
  checkResult,
  describeGuardReason,
  type GuardSpec,
} from './validate/domain.ts';

export * from './helpers/index.ts';
