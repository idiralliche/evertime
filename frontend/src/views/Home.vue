<script setup lang="ts">
import { ref, onMounted } from "vue";
import TaskInput from "../components/TaskInput.vue";
import { listTasks, createTaskFromInput, deleteTask, clearAllTasks } from "../db";
import type { DbTask } from "../db";
import { formatDuration } from "../utils/format";

type UiTask = { id: string; title: string; estMin?: number; createdAt: string };

// base64 → UTF-8 text
function decodeBase64(b64: string): string {
  try {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "(invalid)";
  }
}

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
  tasks.value = rows.map(toUiTask);
}

async function handleAddTask(payload: { title: string; estMin?: number }) {
  const created = await createTaskFromInput(payload);
  tasks.value.unshift(toUiTask(created));
}

async function handleDeleteTask(id: string) {
  await deleteTask(id);
  tasks.value = tasks.value.filter(t => t.id !== id);
}

async function handleClearAll() {
  if (!confirm("Supprimer toutes les tâches ?")) return; // safety
  await clearAllTasks();
  tasks.value = [];
}

onMounted(() => { void loadTasks(); });
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
  <div style="display:flex;align-items:center;justify-content:space-between;">
    <h2>Mes tâches</h2>
    <button class="btn" @click="handleClearAll">Tout effacer</button>
  </div>

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
          <span v-if="t.estMin">{{ formatDuration(t.estMin) }} — </span>
          {{ new Date(t.createdAt).toLocaleString() }}
        </small>
      </div>
      <div class="inline">
        <button class="btn">Détails</button>
        <button class="btn" @click="handleDeleteTask(t.id)">Supprimer</button>
      </div>
    </li>
  </ul>
</div>
  </section>
</template>

