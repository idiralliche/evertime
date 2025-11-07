// Dexie-backed repository implementing the TasksRepo port.
import { listTasks, createTaskFromInput, deleteTask, deleteTasks, updateTask } from "../db";
import { decodeCiphertext } from "../codec/taskCiphertext";
import type { DbTask } from "../db";
import type { TaskModel, TaskCreateInput, TaskUpdateInput, TasksRepo } from "./tasks.port";

function toModel(row: DbTask): TaskModel {
  return {
    id: row.id,
    title: decodeCiphertext(row.title_ciphertext),
    estMin: row.est_duration_min ?? undefined,
    createdAt: row.created_at,
  };
}

export function createDexieRepo(): TasksRepo {
  return {
    async list() {
      const rows = await listTasks();
      return rows.map(toModel);
    },
    async create(input: TaskCreateInput) {
      const created = await createTaskFromInput(input);
      return toModel(created);
    },
    async update(input: TaskUpdateInput) {
      const updated = await updateTask(input.id, {
        title: input.title,
        estMin: input.estMin ?? null,
      });
      return toModel(updated);
    },
    async deleteOne(id: string) {
      await deleteTask(id);
    },
    async deleteMany(ids: string[]) {
      await deleteTasks(ids);
    },
  };
}
