<script setup lang="ts">
// Replace in-memory list with Dexie-powered helpers.
import { ref, onMounted } from "vue";
import TaskInput from "../components/TaskInput.vue";

import { getAllTasksDesc, insertTask } from "../db";
import type { TaskRecord } from "../db";

const tasks = ref<TaskRecord[]>([]);

async function handleAddTask(payload: { title: string; estMin?: number }) {
  const rec = await insertTask(payload);   // persist in IndexedDB
  tasks.value.unshift(rec);                // optimistic UI (same UX as before)
}

onMounted(async () => {
  tasks.value = await getAllTasksDesc();   // initial load from IndexedDB
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
