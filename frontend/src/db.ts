// Dexie DB for offline-first tasks storage (OpenAPI-aligned).
import Dexie, { type Table } from 'dexie';
import { encodeCiphertext } from './codec/taskCiphertext';

export type Priority = 'low' | 'normal' | 'high';
export type TaskStatus = 'inbox' | 'planned' | 'completed' | 'cancelled';

export interface DbTask {
  id: string;
  title_ciphertext: string;
  notes_ciphertext?: string | null;
  est_duration_min?: number | null;
  priority: Priority;
  is_urgent: boolean;
  due_at?: string | null;
  flexibility_score: number;
  status: TaskStatus;
  parent_task_id?: string | null;
  recurrence_series_id?: string | null;
  tag_ids?: string[];
  created_at: string;
  updated_at: string;
  etag: string;
}

export class EverTimeDB extends Dexie {
  tasks!: Table<DbTask, string>;

  constructor() {
    super('EverTimeDB');

    // v1 (initial schema) — kept for upgrade path
    this.version(1).stores({
      tasks: 'id, status, priority, due_at, updated_at'
    });

    // v2 — add missing index on created_at so we can orderBy('created_at')
    this.version(2).stores({
      tasks: 'id, created_at, status, priority, due_at, updated_at'
    }).upgrade(tx => {
      // Ensure created_at exists to build the new index
      return tx.table('tasks').toCollection().modify((t: any) => {
        if (!t.created_at) t.created_at = t.updated_at ?? new Date().toISOString();
      });
    });
  }
}

export const db = new EverTimeDB();

// ---- Data-access helpers
export async function listTasks(): Promise<DbTask[]> {
  // newest first
  return db.tasks.orderBy('created_at').reverse().toArray();
}

export async function createTaskFromInput(payload: { title: string; estMin?: number; notes?: string; }): Promise<DbTask> {
  const now = new Date().toISOString();
  const task: DbTask = {
    id: crypto.randomUUID(),
    title_ciphertext: encodeCiphertext(payload.title),
    notes_ciphertext: payload.notes && payload.notes.trim() ? encodeCiphertext(payload.notes) : null,
    est_duration_min: payload.estMin ?? null,
    priority: 'normal',
    is_urgent: false,
    due_at: null,
    flexibility_score: 50,
    status: 'inbox',
    tag_ids: [],
    created_at: now,
    updated_at: now,
    etag: `W/"${now}"`
  };
  await db.tasks.add(task);
  return task;
}

// Deletion helpers (single, many, all).
export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

// delete many tasks by IDs (bulk)
export async function deleteTasks(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.tasks.bulkDelete(ids);
}

export async function clearAllTasks(): Promise<void> {
  await db.tasks.clear();
}

// Update notes; empty/whitespace => null; bumps updated_at/etag.
export async function updateTaskNotes(id: string, notesPlain: string | undefined): Promise<void> {
  const trimmed = (notesPlain ?? '').trim();
  const notes_ciphertext = trimmed ? encodeCiphertext(trimmed) : null;
  const now = new Date().toISOString();
  await db.tasks.update(id, { notes_ciphertext, updated_at: now, etag: `W/"${now}"` });
}
