/**
 * P11: one storage interface, two adapters.
 *
 * ADR-004: the desktop uses SQLite through the Tauri SQL plugin and the web uses IndexedDB, behind
 * a single interface. Both serialise to the same portable JSON workspace format, so a file written
 * on one runs on the other. That portability is the point: a student who works in a browser at home
 * and on a locked-down campus machine from a flash drive is the same student.
 *
 * The table shapes come from desktop.data_storage.tables and are followed by both adapters, so the
 * SQLite schema and the IndexedDB object stores carry the same columns under the same names.
 */

import type { Locale } from '../locale/index.ts';

export type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type Currency = 'IDR' | 'USD' | 'EUR';

/** workspaces: id TEXT PK, name, locale, currency, period, created_at, updated_at */
export interface WorkspaceRecord {
  readonly id: string;
  readonly name: string;
  readonly locale: Locale;
  readonly currency: Currency;
  readonly period: Period;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * values: workspace_id, variable_id, magnitude REAL, origin, derived_by, derived_from,
 * confidence, PRIMARY KEY (workspace_id, variable_id)
 *
 * `derivedFrom` is stored as a list and serialised to a delimited string by the SQLite adapter,
 * which has no array column. The JSON format keeps it a list, because the JSON file is what a
 * person reads.
 */
export interface ValueRecord {
  readonly workspaceId: string;
  readonly variableId: string;
  readonly magnitude: number;
  readonly origin: 'user' | 'derived' | 'assumed' | 'scenario';
  readonly derivedBy: string | null;
  readonly derivedFrom: readonly string[];
  readonly confidence: 'exact' | 'estimated' | 'assumed';
}

/** progress: formula_id TEXT PK, state, streak, attempts, correct, interval_index, next_review */
export interface ProgressRecord {
  readonly formulaId: string;
  readonly state: 'unseen' | 'seen' | 'practising' | 'mastered' | 'due';
  readonly streak: number;
  readonly attempts: number;
  readonly correct: number;
  readonly intervalIndex: number;
  readonly nextReview: string | null;
}

/** settings: key TEXT PK, value TEXT */
export interface SettingRecord {
  readonly key: string;
  readonly value: string;
}

/**
 * The portable JSON workspace format.
 *
 * `schema` is a number rather than a name so an older file can be recognised and refused with a
 * sentence instead of being half-read. `generatedBy` records the application and specification
 * version that wrote it, which is what makes a file auditable a year later.
 */
export interface WorkspaceFile {
  readonly schema: 1;
  readonly generatedBy: { readonly app: string; readonly spec: string };
  readonly exportedAt: string;
  readonly workspace: WorkspaceRecord;
  readonly values: readonly ValueRecord[];
  readonly progress: readonly ProgressRecord[];
  readonly settings: readonly SettingRecord[];
}

export interface Storage {
  /** Where this adapter actually put the data, for the status bar to state plainly. */
  readonly describe: () => {
    readonly kind: 'indexeddb' | 'sqlite' | 'memory';
    readonly location: string;
  };
  readonly listWorkspaces: () => Promise<readonly WorkspaceRecord[]>;
  readonly readWorkspace: (id: string) => Promise<WorkspaceFile | null>;
  readonly writeWorkspace: (file: WorkspaceFile) => Promise<void>;
  readonly renameWorkspace: (id: string, name: string) => Promise<void>;
  readonly deleteWorkspace: (id: string) => Promise<void>;
  readonly close: () => void;
}

export const SCHEMA_VERSION = 1 as const;
export const DATABASE_NAME = 'metrika';
export const DATABASE_VERSION = 1;
