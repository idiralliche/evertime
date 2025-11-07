// Storage-agnostic contract for Tasks.

export type TaskCreateInput = { title: string; estMin?: number };

export type TaskUpdateInput = {
  id: string;
  title?: string;          // optional; when set, must be non-empty after trim
  estMin?: number | null;  // null to clear estimation
};


export type TaskModel = {
  id: string;
  title: string;
  estMin?: number;
  createdAt: string;
};

export interface TasksRepo {
  list(): Promise<TaskModel[]>;
  create(input: TaskCreateInput): Promise<TaskModel>;
  update(input: TaskUpdateInput): Promise<TaskModel>;
  deleteOne(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
