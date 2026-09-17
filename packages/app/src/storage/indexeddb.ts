/**
 * P11: the IndexedDB adapter, which is the web half of ADR-004.
 *
 * Everything stays on the reader's own machine. There is no server, no account and no sync, so
 * nothing here can leak: the only way data leaves is the export command, which the person runs and
 * which writes a file they choose.
 *
 * IndexedDB is not always available. A private window, blocked site data or a locked-down policy
 * can all refuse it, and the failure mode matters: the application must say that progress will not
 * persist rather than appear to save and quietly lose the work. `openStorage` therefore falls back
 * to an in-memory adapter and reports which one the caller got.
 */

import {
  DATABASE_NAME,
  DATABASE_VERSION,
  type Storage,
  type WorkspaceFile,
  type WorkspaceRecord,
} from './types.ts';

const WORKSPACES = 'workspaces';
const FILES = 'files';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed.'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(WORKSPACES))
        db.createObjectStore(WORKSPACES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES, { keyPath: 'id' });
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error ?? new Error('IndexedDB could not be opened.'));
    open.onblocked = () => reject(new Error('IndexedDB is blocked by another open tab.'));
  });
}

export async function createIndexedDbStorage(): Promise<Storage> {
  const db = await openDatabase();

  const tx = <T>(
    store: string,
    mode: IDBTransactionMode,
    run: (s: IDBObjectStore) => IDBRequest<T>,
  ) =>
    new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(store, mode);
      const req = run(transaction.objectStore(store));
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed.'));
    });

  return {
    describe: () => ({ kind: 'indexeddb', location: `${DATABASE_NAME} v${DATABASE_VERSION}` }),

    listWorkspaces: async () => {
      const rows = await tx<WorkspaceRecord[]>(WORKSPACES, 'readonly', (store) => store.getAll());
      return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    readWorkspace: async (id) => {
      const row = await tx<{ id: string; file: WorkspaceFile } | undefined>(
        FILES,
        'readonly',
        (store) => store.get(id),
      );
      return row?.file ?? null;
    },

    writeWorkspace: async (file) => {
      await tx(WORKSPACES, 'readwrite', (store) => store.put(file.workspace));
      await tx(FILES, 'readwrite', (store) => store.put({ id: file.workspace.id, file }));
    },

    renameWorkspace: async (id, name) => {
      const existing = await tx<WorkspaceRecord | undefined>(WORKSPACES, 'readonly', (store) =>
        store.get(id),
      );
      if (existing === undefined) return;
      const updated: WorkspaceRecord = { ...existing, name, updatedAt: new Date().toISOString() };
      await tx(WORKSPACES, 'readwrite', (store) => store.put(updated));

      const file = await tx<{ id: string; file: WorkspaceFile } | undefined>(
        FILES,
        'readonly',
        (store) => store.get(id),
      );
      if (file !== undefined) {
        await tx(FILES, 'readwrite', (store) =>
          store.put({ id, file: { ...file.file, workspace: updated } }),
        );
      }
    },

    deleteWorkspace: async (id) => {
      await tx(WORKSPACES, 'readwrite', (store) => store.delete(id));
      await tx(FILES, 'readwrite', (store) => store.delete(id));
    },

    close: () => db.close(),
  };
}

/**
 * The in-memory fallback.
 *
 * desktop.portable_build.storage_probe_order ends here for the portable executable, and the web
 * build needs the same honesty: when storage is refused, the work still computes but nothing is
 * kept, and the status bar has to say so.
 */
export function createMemoryStorage(): Storage {
  const workspaces = new Map<string, WorkspaceRecord>();
  const files = new Map<string, WorkspaceFile>();

  return {
    describe: () => ({ kind: 'memory', location: '' }),
    listWorkspaces: async () =>
      [...workspaces.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    readWorkspace: async (id) => files.get(id) ?? null,
    writeWorkspace: async (file) => {
      workspaces.set(file.workspace.id, file.workspace);
      files.set(file.workspace.id, file);
    },
    renameWorkspace: async (id, name) => {
      const existing = workspaces.get(id);
      if (existing === undefined) return;
      const updated = { ...existing, name, updatedAt: new Date().toISOString() };
      workspaces.set(id, updated);
      const file = files.get(id);
      if (file !== undefined) files.set(id, { ...file, workspace: updated });
    },
    deleteWorkspace: async (id) => {
      workspaces.delete(id);
      files.delete(id);
    },
    close: () => {},
  };
}

export interface OpenedStorage {
  readonly storage: Storage;
  /** True when persistence was refused and the work will not survive a reload. */
  readonly ephemeral: boolean;
  /** Where the data actually went, for the status bar to state rather than imply. */
  readonly location: string;
}

/**
 * Open the best storage available, and say plainly which one that turned out to be.
 *
 * Inside the desktop shell that is SQLite at the path the portable probe chose. In a browser it is
 * IndexedDB. When both are refused it is memory, and `ephemeral` is true so the caller can warn
 * that progress will not persist, which is the third step of
 * desktop.portable_build.storage_probe_order.
 */
export async function openStorage(): Promise<OpenedStorage> {
  const { isDesktop, createSqliteStorage } = await import('./tauri.ts');

  if (isDesktop()) {
    try {
      const { storage, location } = await createSqliteStorage();
      return { storage, ephemeral: location.ephemeral, location: location.database };
    } catch {
      // Fall through to the browser path: a desktop shell whose database cannot be opened is still
      // a working calculator, and saying so is better than refusing to start.
    }
  }

  if (typeof indexedDB === 'undefined') {
    return { storage: createMemoryStorage(), ephemeral: true, location: '' };
  }
  try {
    const storage = await createIndexedDbStorage();
    return { storage, ephemeral: false, location: storage.describe().location };
  } catch {
    return { storage: createMemoryStorage(), ephemeral: true, location: '' };
  }
}

export { request };
