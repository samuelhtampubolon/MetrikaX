/**
 * The portable JSON workspace format: writing it, reading it back, and refusing a file that is not
 * one rather than half-reading it.
 *
 * desktop.data_storage.portability: one File menu command exports the entire database as a single
 * JSON file that the web build can import, and the reverse. This module is that format, and it is
 * deliberately the only place that knows its shape.
 */

import {
  SCHEMA_VERSION,
  type ProgressRecord,
  type SettingRecord,
  type ValueRecord,
  type WorkspaceFile,
  type WorkspaceRecord,
} from './types.ts';

export const APP_VERSION = '0.1.0';
export const SPEC_VERSION = '1.0.1';

export class WorkspaceFileError extends Error {
  readonly messages: { readonly id: string; readonly en: string };
  constructor(messages: { id: string; en: string }) {
    super(messages.en);
    this.name = 'WorkspaceFileError';
    this.messages = messages;
  }
}

export function buildWorkspaceFile(parts: {
  workspace: WorkspaceRecord;
  values: readonly ValueRecord[];
  progress?: readonly ProgressRecord[];
  settings?: readonly SettingRecord[];
  now?: string;
}): WorkspaceFile {
  return {
    schema: SCHEMA_VERSION,
    generatedBy: { app: APP_VERSION, spec: SPEC_VERSION },
    exportedAt: parts.now ?? new Date().toISOString(),
    workspace: parts.workspace,
    values: parts.values,
    progress: parts.progress ?? [],
    settings: parts.settings ?? [],
  };
}

export function serialiseWorkspace(file: WorkspaceFile): string {
  // Two spaces and a trailing newline: the file is meant to be opened and read, and a diff between
  // two exports should be legible.
  return `${JSON.stringify(file, null, 2)}\n`;
}

/**
 * Parse a workspace file.
 *
 * Every failure is named. A file from a newer schema is refused with a sentence saying so rather
 * than being read partially, because a workspace that loads with half its values missing is worse
 * than one that refuses to load at all.
 */
export function parseWorkspace(text: string): WorkspaceFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new WorkspaceFileError({
      id: 'Berkas ini bukan JSON yang sah, sehingga tidak dapat dibaca.',
      en: 'This file is not valid JSON, so it cannot be read.',
    });
  }

  if (typeof raw !== 'object' || raw === null) {
    throw new WorkspaceFileError({
      id: 'Berkas ini tidak memuat objek ruang kerja.',
      en: 'This file does not contain a workspace object.',
    });
  }

  const candidate = raw as Partial<WorkspaceFile>;

  if (candidate.schema !== SCHEMA_VERSION) {
    throw new WorkspaceFileError({
      id:
        `Berkas ini memakai skema versi ${String(candidate.schema)}, sedangkan perangkat ini ` +
        `membaca versi ${SCHEMA_VERSION}. Pakai versi perangkat yang menulis berkas itu.`,
      en:
        `This file uses schema version ${String(candidate.schema)} while this application reads ` +
        `version ${SCHEMA_VERSION}. Use the version of the application that wrote it.`,
    });
  }

  const workspace = candidate.workspace;
  if (
    typeof workspace !== 'object' ||
    workspace === null ||
    typeof workspace.id !== 'string' ||
    typeof workspace.name !== 'string'
  ) {
    throw new WorkspaceFileError({
      id: 'Bagian ruang kerja pada berkas ini tidak lengkap.',
      en: 'The workspace section of this file is incomplete.',
    });
  }

  const values = Array.isArray(candidate.values) ? candidate.values : [];
  for (const [index, value] of values.entries()) {
    if (
      typeof value !== 'object' ||
      value === null ||
      typeof value.variableId !== 'string' ||
      typeof value.magnitude !== 'number' ||
      !Number.isFinite(value.magnitude)
    ) {
      throw new WorkspaceFileError({
        id: `Nilai ke-${index + 1} pada berkas ini tidak sah.`,
        en: `Value number ${index + 1} in this file is not valid.`,
      });
    }
  }

  return {
    schema: SCHEMA_VERSION,
    generatedBy: candidate.generatedBy ?? { app: 'unknown', spec: 'unknown' },
    exportedAt: candidate.exportedAt ?? new Date(0).toISOString(),
    workspace,
    values,
    progress: Array.isArray(candidate.progress) ? candidate.progress : [],
    settings: Array.isArray(candidate.settings) ? candidate.settings : [],
  };
}
