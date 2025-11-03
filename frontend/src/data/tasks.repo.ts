// Export the current repo implementation.
// Later we can switch to an HTTP repo without touching the views.
import { createDexieRepo } from "./tasks.repo.dexie";
export const tasksRepo = createDexieRepo();
