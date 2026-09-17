/**
 * P24: the SQLite adapter, which is the desktop half of ADR-004.
 *
 * This is not interchangeable with IndexedDB, and the difference is the whole point of the portable
 * build. A webview keeps IndexedDB inside its own profile directory, which lives on the machine
 * rather than on the flash drive. SQLite at `<storage>/metrika.db` lives where the probe put it,
 * which for the portable executable is the directory the executable itself is in. That is what lets
 * a student carry their work between a campus machine and a laptop.
 *
 * The schema is the one in desktop.data_storage.tables, column for column.
 *
 * Every import here is dynamic. The web build must not carry the plugin, and a browser that
 * evaluated it would be loading code for an environment it is not in.
 */

import {
  type ProgressRecord,
  type SettingRecord,
  type Storage,
  type ValueRecord,
  type WorkspaceFile,
  type WorkspaceRecord,
} from './types.ts';

interface SqlDatabase {
  execute: (query: string, values?: unknown[]) => Promise<unknown>;
  select: <T>(query: string, values?: unknown[]) => Promise<T>;
  close: () => Promise<boolean>;
}

export interface StorageLocation {
  readonly kind: 'portable' | 'user_profile' | 'memory';
  readonly directory: string;
  readonly database: string;
  readonly ephemeral: boolean;
}

/** True when the application is running inside the desktop shell rather than in a browser. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS workspaces (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     locale TEXT NOT NULL,
     currency TEXT NOT NULL,
     period TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS values_table (
     workspace_id TEXT NOT NULL,
     variable_id TEXT NOT NULL,
     magnitude REAL NOT NULL,
     origin TEXT NOT NULL,
     derived_by TEXT,
     derived_from TEXT,
     confidence TEXT NOT NULL,
     PRIMARY KEY (workspace_id, variable_id)
   )`,
  `CREATE TABLE IF NOT EXISTS progress (
     formula_id TEXT PRIMARY KEY,
     state TEXT NOT NULL,
     streak INTEGER NOT NULL,
     attempts INTEGER NOT NULL,
     correct INTEGER NOT NULL,
     interval_index INTEGER NOT NULL,
     next_review TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     id TEXT PRIMARY KEY,
     started_at TEXT NOT NULL,
     ended_at TEXT,
     items INTEGER NOT NULL,
     correct INTEGER NOT NULL,
     xp_earned INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,
];

/**
 * `values` is a reserved word in SQL, so the table is named `values_table` while the JSON format
 * and the specification keep calling it values. The name is an implementation detail of one
 * adapter; the portable file format is what has to stay stable.
 */
export async function createSqliteStorage(): Promise<{
  storage: Storage;
  location: StorageLocation;
}> {
  const { invoke } = await import('@tauri-apps/api/core');
  const location = await invoke<StorageLocation>('storage_location');

  const { default: Database } = await import('@tauri-apps/plugin-sql');
  // The memory case still opens a database, so every query below works unchanged; it simply keeps
  // nothing once the window closes, and the caller warns about that.
  const url = location.ephemeral ? 'sqlite::memory:' : `sqlite:${location.database}`;
  const db = (await Database.load(url)) as unknown as SqlDatabase;

  for (const statement of SCHEMA) await db.execute(statement);

  const storage: Storage = {
    describe: () => ({ kind: 'sqlite', location: location.database }),

    listWorkspaces: async () => {
      const rows = await db.select<
        {
          id: string;
          name: string;
          locale: string;
          currency: string;
          period: string;
          created_at: string;
          updated_at: string;
        }[]
      >('SELECT * FROM workspaces ORDER BY updated_at DESC');
      return rows.map(
        (row): WorkspaceRecord => ({
          id: row.id,
          name: row.name,
          locale: row.locale as WorkspaceRecord['locale'],
          currency: row.currency as WorkspaceRecord['currency'],
          period: row.period as WorkspaceRecord['period'],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }),
      );
    },

    readWorkspace: async (id) => {
      const rows = await db.select<
        {
          id: string;
          name: string;
          locale: string;
          currency: string;
          period: string;
          created_at: string;
          updated_at: string;
        }[]
      >('SELECT * FROM workspaces WHERE id = $1', [id]);
      const row = rows[0];
      if (row === undefined) return null;

      const valueRows = await db.select<
        {
          workspace_id: string;
          variable_id: string;
          magnitude: number;
          origin: string;
          derived_by: string | null;
          derived_from: string | null;
          confidence: string;
        }[]
      >('SELECT * FROM values_table WHERE workspace_id = $1', [id]);

      const progressRows = await db.select<
        {
          formula_id: string;
          state: string;
          streak: number;
          attempts: number;
          correct: number;
          interval_index: number;
          next_review: string | null;
        }[]
      >('SELECT * FROM progress');

      const settingRows =
        await db.select<{ key: string; value: string }[]>('SELECT * FROM settings');

      const file: WorkspaceFile = {
        schema: 1,
        generatedBy: { app: '0.1.0', spec: '1.0.1' },
        exportedAt: row.updated_at,
        workspace: {
          id: row.id,
          name: row.name,
          locale: row.locale as WorkspaceRecord['locale'],
          currency: row.currency as WorkspaceRecord['currency'],
          period: row.period as WorkspaceRecord['period'],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        values: valueRows.map(
          (value): ValueRecord => ({
            workspaceId: value.workspace_id,
            variableId: value.variable_id,
            magnitude: value.magnitude,
            origin: value.origin as ValueRecord['origin'],
            derivedBy: value.derived_by,
            // SQLite has no array column, so the list is stored delimited and split back here. The
            // JSON file keeps it a real list, because that file is what a person reads.
            derivedFrom:
              value.derived_from === null || value.derived_from === ''
                ? []
                : value.derived_from.split(','),
            confidence: value.confidence as ValueRecord['confidence'],
          }),
        ),
        progress: progressRows.map(
          (progress): ProgressRecord => ({
            formulaId: progress.formula_id,
            state: progress.state as ProgressRecord['state'],
            streak: progress.streak,
            attempts: progress.attempts,
            correct: progress.correct,
            intervalIndex: progress.interval_index,
            nextReview: progress.next_review,
          }),
        ),
        settings: settingRows.map(
          (setting): SettingRecord => ({ key: setting.key, value: setting.value }),
        ),
      };
      return file;
    },

    writeWorkspace: async (file) => {
      const w = file.workspace;
      await db.execute(
        `INSERT INTO workspaces (id, name, locale, currency, period, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name, locale = excluded.locale, currency = excluded.currency,
           period = excluded.period, updated_at = excluded.updated_at`,
        [w.id, w.name, w.locale, w.currency, w.period, w.createdAt, w.updatedAt],
      );

      // The stored value set is replaced rather than merged: a value the person deleted must not
      // survive a save.
      await db.execute('DELETE FROM values_table WHERE workspace_id = $1', [w.id]);
      for (const value of file.values) {
        await db.execute(
          `INSERT INTO values_table
             (workspace_id, variable_id, magnitude, origin, derived_by, derived_from, confidence)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            w.id,
            value.variableId,
            value.magnitude,
            value.origin,
            value.derivedBy,
            value.derivedFrom.join(','),
            value.confidence,
          ],
        );
      }
    },

    renameWorkspace: async (id, name) => {
      await db.execute('UPDATE workspaces SET name = $1, updated_at = $2 WHERE id = $3', [
        name,
        new Date().toISOString(),
        id,
      ]);
    },

    deleteWorkspace: async (id) => {
      await db.execute('DELETE FROM values_table WHERE workspace_id = $1', [id]);
      await db.execute('DELETE FROM workspaces WHERE id = $1', [id]);
    },

    close: () => {
      void db.close();
    },
  };

  return { storage, location };
}
