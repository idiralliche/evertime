<script setup lang="ts">
// Replace in-memory array with Dexie persistence.
import { ref, onMounted } from "vue";
import TaskInput from "../components/TaskInput.vue";
import { listTasks, createTaskFromInput } from "../db";
import type { DbTask } from "../db"; // type-only import (TS verbatimModuleSyntax)

// ---- UI model used by the existing template (do NOT change selectors)
type UiTask = { id: string; title: string; estMin?: number; createdAt: string };

// ---- Base64 decode helper (UTF-8 safe)
function decodeBase64(b64: string): string {
  try {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "(invalid)";
  }
}

// ---- Mapper: DbTask -> UiTask (keeps template intact)
function toUiTask(db: DbTask): UiTask {
  return {
    id: db.id,
    title: decodeBase64(db.title_ciphertext),
    estMin: db.est_duration_min ?? undefined,
    createdAt: db.created_at,
  };
}

const tasks = ref<UiTask[]>([]);

async function loadTasks() {
  const rows = await listTasks();
  tasks.value = rows.map(toUiTask); // newest first preserved
}

async function handleAddTask(payload: { title: string; estMin?: number }) {
  const created = await createTaskFromInput(payload);
  tasks.value.unshift(toUiTask(created)); // optimistic UI
}

onMounted(() => {
  void loadTasks(); // lifecycle: hydrate once on mount
});
</script>

<template>
  <section class="section app">
    <header class="stack">
      <h1>EverTime</h1>
      <p class="u-muted">Capture rapide des tâches (MVP)</p>
    </header>

    <div class="u-card stack" style="margin-top: var(--space-6);">
      <TaskInput @add="handleAddTask" />
    </div>

    <div class="section stack">
      <h2>Mes tâches</h2>
      <ul class="stack">
        <li
          v-for="t in tasks"
          :key="t.id"
          class="u-card"
          style="display:flex;justify-content:space-between;align-items:center;"
        >
          <div>
            <div style="font-weight:600;">{{ t.title }}</div>
            <small class="u-muted">
              <span v-if="t.estMin">{{ t.estMin }} min — </span>
              {{ new Date(t.createdAt).toLocaleString() }}
            </small>
          </div>
          <button class="btn">Détails</button>
        </li>
      </ul>
    </div>
  </section>
</template>
