/**
 * Reader and narrow types for spec/metrika.spec.json.
 *
 * The specification is the single source of truth. Nothing in this package writes back to it.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, '../../..');
export const SPEC_PATH = resolve(REPO_ROOT, 'spec/metrika.spec.json');

export interface LocalisedText {
  id: string;
  en: string;
}

export interface SpecVariable {
  id: string;
  label: LocalisedText;
  unit_class: string;
  value_kind: 'number' | 'integer' | 'array';
  constraints: {
    min: number | null;
    max: number | null;
    decimals: number;
    allow_zero: boolean;
    nullable: boolean;
  };
  definition_id: string;
  storage: { precision: string; serialize_as: string };
  ui: {
    widget: 'numeric_spinner' | 'vector_editor';
    step_hint: string;
    thousand_separator: boolean;
    suffix: string;
  };
}

export interface SpecFormula {
  index: number;
  id: string;
  symbol: string;
  name: LocalisedText;
  slug: string;
  taxonomy: {
    axis_a: { stratum_code: string };
    axis_b: { phase_code: string };
    axis_c: { class_code: string };
    axis_d: { domain_code: string };
    compute_layer: string;
    curriculum_module: number;
    dashboard_tier: 'operational' | 'tactical' | 'strategic';
    reporting_cadence: string;
  };
  definition: LocalisedText & { write_full_prose_in_phase: string };
  expression: {
    latex: string;
    javascript: string;
    requires_helper: string | null;
    alternate_forms: string[];
  };
  inputs: { variable_id: string; role: string; required: boolean; position: number }[];
  output: {
    canonical_variable_id: string | null;
    publishes_to_graph: boolean;
    note: string;
  };
  inverse_solutions: { solve_for: string; javascript: string; note: string }[];
  solvable_directions: number;
  validation: {
    structural_class: string;
    engine_rule: string;
    guard_zero_denominator: boolean;
    reject_negative_counts: boolean;
    warn_on_extreme: boolean;
  };
  interpretation_bands: { lower: number; upper: number; label: string; guidance_id: string }[];
  worked_example: {
    inputs: Record<string, number | number[]>;
    narrative_id: string;
    must_be_verified_by_test: boolean;
  };
  gamification: Record<string, unknown>;
  ui: Record<string, unknown>;
  cross_references: Record<string, string[]>;
}

export interface Spec {
  meta: {
    spec_name: string;
    spec_version: string;
    counts: Record<string, number>;
  };
  canonical_variables: SpecVariable[];
  formula_registry: SpecFormula[];
  locale: {
    default: string;
    supported: string[];
    forbidden_words_in_all_content: string[];
  };
  curriculum: {
    module: number;
    name: LocalisedText;
    formula_ids: string[];
    formula_count: number;
  }[];
  acceptance_criteria: {
    hard_requirements: { id: string; statement: string; verified_by: string }[];
  };
}

let cached: Spec | null = null;

export function loadSpec(): Spec {
  if (cached) return cached;
  const raw = readFileSync(SPEC_PATH, 'utf8');
  cached = JSON.parse(raw) as Spec;
  return cached;
}

export const GENERATED_HEADER = [
  '// GENERATED FILE. DO NOT EDIT.',
  '//',
  '// Emitted by packages/codegen from spec/metrika.spec.json.',
  '// To change anything here, change the specification and run `pnpm codegen`.',
  '// CI fails when a file under a generated directory differs from a fresh generation (AC-17).',
  '',
].join('\n');
