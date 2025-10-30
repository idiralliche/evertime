// Dexie DB for offline-first tasks storage (OpenAPI-aligned shape).
import Dexie, { type Table } from 'dexie';

// ---- Domain model (subset aligned with OpenAPI "Task")
export type Priority = 'low' | 'normal' | 'high';
export type TaskStatus = 'inbox' | 'planned' | 'completed' | 'cancelled';

export interface DbTask {
  id: string;                      // uuid
  title_ciphertext: string;        // base64 placeholder (client-side encryption later)
  notes_ciphertext?: string | null;
  est_duration_min?: number | null;
  priority: Priority;              // default: 'normal'
  is_urgent: boolean;              // default: false
  due_at?: string | null;          // ISO8601 or null
  flexibility_score: number;       // default: 50
  status: TaskStatus;              // default: 'inbox'
  parent_task_id?: string | null;
  recurrence_series_id?: string | null;
  tag_ids?: string[];              // empty array by default
  created_at: string;              // ISO8601
  updated_at: string;              // ISO8601
  etag: string;                    // optimistic concurrency placeholder
}

// ---- Simple base64 placeholder (will be replaced by real client-side crypto later)
function encodeBase64(plain: string): string {
  // Browsers: btoa expects Latin1; ensure UTF-8 compatibility
  return btoa(unescape(encodeURIComponent(plain)));
}

export class EverTimeDB extends Dexie {
  // 'Table' is a type-only import to satisfy "verbatimModuleSyntax"
  tasks!: Table<DbTask, string>;

  constructor() {
    super('EverTimeDB');
    // v1 schema: primary key 'id', with useful indexes for queries
    this.version(1).stores({
      // Indexes: status, priority, due_at, updated_at
      tasks: 'id, status, priority, due_at, updated_at'
    });
  }
}

export const db = new EverTimeDB();

// ---- Minimal data-access helpers (read/insert)
export async function listTasks(): Promise<DbTask[]> {
  // newest first by created_at
  return db.tasks.orderBy('created_at').reverse().toArray();
}

export async function createTaskFromInput(payload: { title: string; estMin?: number }): Promise<DbTask> {
  const now = new Date().toISOString();
  const task: DbTask = {
    id: crypto.randomUUID(),
    title_ciphertext: encodeBase64(payload.title.trim()),
    est_duration_min: payload.estMin ?? null,
    priority: 'normal',
    is_urgent: false,
    due_at: null,
    flexibility_score: 50,
    status: 'inbox',
    tag_ids: [],
    created_at: now,
    updated_at: now,
    // Weak ETag placeholder: will be replaced by server-provided ETag post-sync
    etag: `W/"${now}"`
  };

  await db.tasks.add(task);
  return task;
}
