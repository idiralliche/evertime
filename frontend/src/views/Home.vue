<script setup lang="ts">
// Minimal local state; we'll replace with a store later.
import { ref } from "vue";
import TaskInput from "../components/TaskInput.vue";

type Task = { id: string; title: string; estMin?: number; createdAt: string };

const tasks = ref<Task[]>([]);

function handleAddTask(payload: { title: string; estMin?: number }) {
  const now = new Date().toISOString();
  tasks.value.unshift({
    id: crypto.randomUUID(),
    title: payload.title.trim(),
    estMin: payload.estMin,
    createdAt: now,
  });
}
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
