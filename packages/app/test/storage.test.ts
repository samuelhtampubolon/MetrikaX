/**
 * P11 storage tests.
 *
 * The definition of done is that a workspace survives a reload and round trips through JSON export.
 * A reload is simulated the only way it can be in a test runner: close the adapter, open a fresh
 * one against the same database, and read back what the first one wrote.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

import {
  createIndexedDbStorage,
  createMemoryStorage,
  openStorage,
} from '../src/storage/indexeddb.ts';
import {
  buildWorkspaceFile,
  parseWorkspace,
  serialiseWorkspace,
  WorkspaceFileError,
} from '../src/storage/format.ts';
import { useWorkspace } from '../src/state/workspace.ts';
import type { ValueRecord, WorkspaceRecord } from '../src/storage/types.ts';

const WORKSPACE: WorkspaceRecord = {
  id: 'ws-test-1',
  name: 'Kampanye Kuartal Tiga',
  locale: 'id',
  currency: 'IDR',
  period: 'monthly',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const VALUES: ValueRecord[] = [
  {
    workspaceId: WORKSPACE.id,
    variableId: 'revenue',
    magnitude: 185_000_000,
    origin: 'user',
    derivedBy: null,
    derivedFrom: [],
    confidence: 'exact',
  },
  {
    workspaceId: WORKSPACE.id,
    variableId: 'aov',
    magnitude: 125_000,
    origin: 'derived',
    derivedBy: 'aov',
    derivedFrom: ['revenue', 'orders'],
    confidence: 'exact',
  },
];

describe('the portable JSON format', () => {
  it('round trips a workspace without losing a value or a provenance', () => {
    const file = buildWorkspaceFile({
      workspace: WORKSPACE,
      values: VALUES,
      now: '2026-02-02T00:00:00.000Z',
    });
    const back = parseWorkspace(serialiseWorkspace(file));

    expect(back.workspace).toEqual(WORKSPACE);
    expect(back.values).toEqual(VALUES);
    expect(back.values[1]?.derivedFrom).toEqual(['revenue', 'orders']);
    expect(back.exportedAt).toBe('2026-02-02T00:00:00.000Z');
  });

  it('records which application and which specification version wrote the file', () => {
    const file = buildWorkspaceFile({ workspace: WORKSPACE, values: [] });
    expect(file.generatedBy.spec).toBe('1.0.1');
    expect(file.generatedBy.app).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('is written so a person can read it and a diff can be followed', () => {
    const text = serialiseWorkspace(buildWorkspaceFile({ workspace: WORKSPACE, values: VALUES }));
    expect(text.endsWith('\n')).toBe(true);
    expect(text.split('\n').length).toBeGreaterThan(10);
  });

  it('refuses a file that is not JSON, naming what is wrong', () => {
    const error = catchError(() => parseWorkspace('{not json'));
    expect(error).toBeInstanceOf(WorkspaceFileError);
    expect((error as WorkspaceFileError).messages.id).toContain('bukan JSON');
  });

  it('refuses a file from a newer schema rather than reading half of it', () => {
    const text = JSON.stringify({ schema: 2, workspace: WORKSPACE, values: [] });
    const error = catchError(() => parseWorkspace(text));
    expect(error).toBeInstanceOf(WorkspaceFileError);
    expect((error as WorkspaceFileError).messages.en).toContain('schema version 2');
  });

  it('refuses a value whose magnitude is not a finite number', () => {
    const text = JSON.stringify({
      schema: 1,
      workspace: WORKSPACE,
      values: [{ variableId: 'revenue', magnitude: 'banyak' }],
    });
    const error = catchError(() => parseWorkspace(text));
    expect(error).toBeInstanceOf(WorkspaceFileError);
    expect((error as WorkspaceFileError).messages.en).toContain('Value number 1');
  });
});

describe('the IndexedDB adapter', () => {
  it('a workspace survives being closed and opened again, which is what a reload is', async () => {
    const first = await createIndexedDbStorage();
    await first.writeWorkspace(buildWorkspaceFile({ workspace: WORKSPACE, values: VALUES }));
    first.close();

    // A second adapter over the same database: the state a reload would find.
    const second = await createIndexedDbStorage();
    const back = await second.readWorkspace(WORKSPACE.id);

    expect(back).not.toBeNull();
    expect(back!.workspace.name).toBe('Kampanye Kuartal Tiga');
    expect(back!.values).toHaveLength(2);
    second.close();
  });

  it('lists workspaces with the most recently touched first', async () => {
    const storage = await createIndexedDbStorage();
    await storage.writeWorkspace(
      buildWorkspaceFile({
        workspace: { ...WORKSPACE, id: 'older', updatedAt: '2026-01-01T00:00:00.000Z' },
        values: [],
      }),
    );
    await storage.writeWorkspace(
      buildWorkspaceFile({
        workspace: { ...WORKSPACE, id: 'newer', updatedAt: '2026-03-01T00:00:00.000Z' },
        values: [],
      }),
    );

    const listed = await storage.listWorkspaces();
    expect(listed[0]?.id).toBe('newer');
    storage.close();
  });

  it('renames and deletes, and a deleted workspace is gone from both stores', async () => {
    const storage = await createIndexedDbStorage();
    await storage.writeWorkspace(
      buildWorkspaceFile({ workspace: { ...WORKSPACE, id: 'ws-rename' }, values: [] }),
    );

    await storage.renameWorkspace('ws-rename', 'Nama Baru');
    const renamed = await storage.readWorkspace('ws-rename');
    expect(renamed?.workspace.name).toBe('Nama Baru');

    await storage.deleteWorkspace('ws-rename');
    expect(await storage.readWorkspace('ws-rename')).toBeNull();
    expect((await storage.listWorkspaces()).some((row) => row.id === 'ws-rename')).toBe(false);
    storage.close();
  });

  it('reports where it put the data rather than leaving the caller to guess', async () => {
    const opened = await openStorage();
    expect(opened.storage.describe().kind).toBe('indexeddb');
    expect(opened.ephemeral).toBe(false);
    opened.storage.close();
  });
});

describe('the memory fallback', () => {
  it('still computes and still lists, and says it keeps nothing', async () => {
    const storage = createMemoryStorage();
    await storage.writeWorkspace(buildWorkspaceFile({ workspace: WORKSPACE, values: VALUES }));

    expect(await storage.listWorkspaces()).toHaveLength(1);
    expect(storage.describe().kind).toBe('memory');
  });
});

describe('the workspace store', () => {
  beforeEach(() => {
    useWorkspace.setState({
      storage: null,
      ephemeral: false,
      location: '',
      ready: false,
      current: null,
      values: [],
      known: [],
      lastError: null,
    });
  });

  it('creates a workspace, keeps a value and finds it again after a reopen', async () => {
    await useWorkspace.getState().init();
    await useWorkspace.getState().create('Kampanye Baru');
    await useWorkspace.getState().setValue('revenue', 185_000_000);

    const id = useWorkspace.getState().current!.id;
    expect(useWorkspace.getState().values).toHaveLength(1);

    // Drop the in-memory state the way a reload would, then open the same workspace again.
    useWorkspace.setState({ current: null, values: [] });
    await useWorkspace.getState().open(id);

    expect(useWorkspace.getState().current?.name).toBe('Kampanye Baru');
    expect(useWorkspace.getState().values[0]?.magnitude).toBe(185_000_000);
  });

  it('exports and imports the same workspace without drift', async () => {
    await useWorkspace.getState().init();
    await useWorkspace.getState().create('Ekspor');
    await useWorkspace.getState().setValue('revenue', 185_000_000);
    await useWorkspace.getState().setValue('orders', 1_480);

    const exported = useWorkspace.getState().exportJson();

    useWorkspace.setState({ current: null, values: [] });
    await useWorkspace.getState().importJson(exported);

    expect(useWorkspace.getState().current?.name).toBe('Ekspor');
    expect(
      useWorkspace
        .getState()
        .values.map((value) => value.variableId)
        .sort(),
    ).toEqual(['orders', 'revenue']);
    expect(useWorkspace.getState().lastError).toBeNull();
  });

  it('reports a bad import as a message rather than throwing at the screen', async () => {
    await useWorkspace.getState().init();
    await useWorkspace.getState().importJson('{not json');

    expect(useWorkspace.getState().lastError).not.toBeNull();
    expect(useWorkspace.getState().lastError?.id).toContain('bukan JSON');
  });

  it('a user value overwrites the previous one for that variable rather than accumulating', async () => {
    await useWorkspace.getState().init();
    await useWorkspace.getState().create('Ganti');
    await useWorkspace.getState().setValue('revenue', 1);
    await useWorkspace.getState().setValue('revenue', 2);

    expect(useWorkspace.getState().values).toHaveLength(1);
    expect(useWorkspace.getState().values[0]?.magnitude).toBe(2);
  });
});

function catchError(run: () => unknown): unknown {
  try {
    run();
    return null;
  } catch (error) {
    return error;
  }
}
