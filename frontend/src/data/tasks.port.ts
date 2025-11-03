// Storage-agnostic contract for Tasks.

export type TaskCreateInput = { title: string; estMin?: number };

export type TaskModel = {
  id: string;
  title: string;
  estMin?: number;
  createdAt: string;
};

export interface TasksRepo {
  list(): Promise<TaskModel[]>;
  create(input: TaskCreateInput): Promise<TaskModel>;
  deleteOne(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
