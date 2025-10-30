// Minimal Dexie DB for tasks used by Home.vue.

import Dexie, { type Table } from 'dexie';

export interface TaskRecord {
  id: string;               // uuid
  title: string;            // plaintext (UI)
  estMin?: number;          // optional estimated minutes
  createdAt: string;        // ISO 8601
  updatedAt?: string;       // ISO 8601
}

class EverTimeDB extends Dexie {
  public tasks!: Table<TaskRecord, string>;

  constructor() {
    super('evertime');
    // Primary key + indexes we actually use
    // - createdAt: fast ordering
    // - title: optional future filtering
    this.version(1).stores({
      tasks: 'id, createdAt, title',
    });
    this.tasks = this.table('tasks');
  }
}

export const db = new EverTimeDB();

/** Return newest → oldest to match previous UI `unshift` behaviour. */
export async function getAllTasksDesc(): Promise<TaskRecord[]> {
  return db.tasks.orderBy('createdAt').reverse().toArray();
}

/** Insert a task from the UI payload and return the persisted record. */
export async function insertTask(
  payload: { title: string; estMin?: number }
): Promise<TaskRecord> {
  const now = new Date().toISOString();
  const rec: TaskRecord = {
    id: crypto.randomUUID(),
    title: payload.title.trim(),
    estMin: payload.estMin,
    createdAt: now,
    updatedAt: now,
  };
  await db.tasks.add(rec);
  return rec;
}
