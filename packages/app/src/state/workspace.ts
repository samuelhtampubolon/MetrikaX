/**
 * P11: the workspace store.
 *
 * It owns the current workspace, the values it holds and the storage adapter beneath it. The
 * calculator screen writes user values into it; the workbench reads them back out.
 *
 * Nothing here talks to a network. The only ways data leaves this machine are the two the person
 * performs themselves: the export command writes a file they name, and printing produces a page
 * they asked for.
 */

import { create } from 'zustand';
import { openStorage } from '../storage/indexeddb.ts';
import {
  buildWorkspaceFile,
  parseWorkspace,
  serialiseWorkspace,
  WorkspaceFileError,
} from '../storage/format.ts';
import type {
  Currency,
  Period,
  Storage,
  ValueRecord,
  WorkspaceFile,
  WorkspaceRecord,
} from '../storage/types.ts';
import type { Locale } from '../locale/index.ts';

export interface WorkspaceState {
  readonly storage: Storage | null;
  /** True when storage was refused and the work will not survive a reload. */
  readonly ephemeral: boolean;
  /** Where the data actually went, for the status bar to state rather than imply. */
  readonly location: string;
  readonly ready: boolean;
  readonly current: WorkspaceRecord | null;
  readonly values: readonly ValueRecord[];
  readonly known: readonly WorkspaceRecord[];
  readonly lastError: { readonly id: string; readonly en: string } | null;

  init: () => Promise<void>;
  create: (
    name: string,
    options?: { locale?: Locale; currency?: Currency; period?: Period },
  ) => Promise<void>;
  setValue: (variableId: string, magnitude: number) => Promise<void>;
  removeValue: (variableId: string) => Promise<void>;
  save: () => Promise<void>;
  open: (id: string) => Promise<void>;
  rename: (name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  exportJson: () => string;
  importJson: (text: string) => Promise<void>;
  clearError: () => void;
}

function newId(): string {
  // crypto.randomUUID is present in every runtime this application targets, and it needs no
  // network and no dependency.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ws-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function blankWorkspace(
  name: string,
  options: { locale?: Locale; currency?: Currency; period?: Period } = {},
): WorkspaceRecord {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name,
    locale: options.locale ?? 'id',
    currency: options.currency ?? 'IDR',
    period: options.period ?? 'monthly',
    createdAt: now,
    updatedAt: now,
  };
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  storage: null,
  ephemeral: false,
  location: '',
  ready: false,
  current: null,
  values: [],
  known: [],
  lastError: null,

  init: async () => {
    if (get().ready) return;
    const { storage, ephemeral, location } = await openStorage();
    const known = await storage.listWorkspaces();
    set({ storage, ephemeral, location, ready: true, known });
  },

  create: async (name, options = {}) => {
    const workspace = blankWorkspace(name, options);
    set({ current: workspace, values: [] });
    await get().save();
  },

  setValue: async (variableId, magnitude) => {
    const { current } = get();
    if (current === null) return;
    const record: ValueRecord = {
      workspaceId: current.id,
      variableId,
      magnitude,
      origin: 'user',
      derivedBy: null,
      derivedFrom: [],
      confidence: 'exact',
    };
    set((state) => ({
      values: [...state.values.filter((value) => value.variableId !== variableId), record],
    }));
    await get().save();
  },

  removeValue: async (variableId) => {
    set((state) => ({ values: state.values.filter((value) => value.variableId !== variableId) }));
    await get().save();
  },

  save: async () => {
    const { storage, current, values } = get();
    if (storage === null || current === null) return;
    const updated: WorkspaceRecord = { ...current, updatedAt: new Date().toISOString() };
    await storage.writeWorkspace(buildWorkspaceFile({ workspace: updated, values }));
    set({ current: updated, known: await storage.listWorkspaces() });
  },

  open: async (id) => {
    const { storage } = get();
    if (storage === null) return;
    const file = await storage.readWorkspace(id);
    if (file === null) return;
    set({ current: file.workspace, values: file.values });
  },

  rename: async (name) => {
    const { storage, current } = get();
    if (storage === null || current === null) return;
    await storage.renameWorkspace(current.id, name);
    const updated = { ...current, name, updatedAt: new Date().toISOString() };
    set({ current: updated, known: await storage.listWorkspaces() });
  },

  remove: async (id) => {
    const { storage, current } = get();
    if (storage === null) return;
    await storage.deleteWorkspace(id);
    set({
      known: await storage.listWorkspaces(),
      ...(current?.id === id ? { current: null, values: [] } : {}),
    });
  },

  exportJson: () => {
    const { current, values } = get();
    const workspace = current ?? blankWorkspace('');
    return serialiseWorkspace(buildWorkspaceFile({ workspace, values }));
  },

  importJson: async (text) => {
    let file: WorkspaceFile;
    try {
      file = parseWorkspace(text);
    } catch (error) {
      if (error instanceof WorkspaceFileError) {
        set({ lastError: error.messages });
        return;
      }
      throw error;
    }
    const { storage } = get();
    set({ current: file.workspace, values: file.values, lastError: null });
    if (storage !== null) {
      await storage.writeWorkspace(file);
      set({ known: await storage.listWorkspaces() });
    }
  },

  clearError: () => set({ lastError: null }),
}));
