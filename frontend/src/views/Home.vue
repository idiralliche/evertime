<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import TaskInput from "../components/TaskInput.vue";
import { listTasks, createTaskFromInput, deleteTask, deleteTasks, clearAllTasks } from "../db";
import type { DbTask } from "../db";
import { formatDuration } from "../utils/format";
import { decodeTitleCiphertextToPlain } from "../codec/taskCiphertext";

type UiTask = { id: string; title: string; estMin?: number; createdAt: string };

function toUiTask(db: DbTask): UiTask {
  return {
    id: db.id,
    title: decodeTitleCiphertextToPlain(db.title_ciphertext),
    estMin: db.est_duration_min ?? undefined,
    createdAt: db.created_at,
  };
}

const tasks = ref<UiTask[]>([]);
const selected = ref<Set<string>>(new Set());
const selectedCount = computed(() => selected.value.size);
const allSelected = computed(() => tasks.value.length > 0 && selected.value.size === tasks.value.length);

async function loadTasks() {
  const rows = await listTasks();
  tasks.value = rows.map(toUiTask);
  // keep selection coherent after refresh
  const keep = new Set<string>();
  for (const t of tasks.value) if (selected.value.has(t.id)) keep.add(t.id);
  selected.value = keep;
}

async function handleAddTask(payload: { title: string; estMin?: number }) {
  const created = await createTaskFromInput(payload);
  tasks.value.unshift(toUiTask(created));
}

function toggleOne(id: string, checked: boolean) {
  const next = new Set(selected.value);
  if (checked) next.add(id); else next.delete(id);
  selected.value = next; // reassign to trigger reactivity
}

function toggleAll(checked: boolean) {
  selected.value = checked ? new Set(tasks.value.map(t => t.id)) : new Set();
}

async function bulkDeleteSelected() {
  const ids = Array.from(selected.value);
  if (!ids.length) return;
  if (!confirm(`Supprimer ${ids.length} tâche(s) sélectionnée(s) ?`)) return;
  await deleteTasks(ids);
  const alive = new Set(ids);
  tasks.value = tasks.value.filter(t => !alive.has(t.id));
  selected.value = new Set();
}

async function handleDeleteTask(id: string) {
  await deleteTask(id);
  tasks.value = tasks.value.filter(t => t.id !== id);
  if (selected.value.has(id)) {
    const next = new Set(selected.value);
    next.delete(id);
    selected.value = next;
  }
}

async function handleClearAll() {
  if (!confirm("Supprimer toutes les tâches ?")) return;
  await clearAllTasks();
  tasks.value = [];
  selected.value = new Set();
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

        <!-- Bulk actions (minimal UI, no extra styles needed) -->
        <div class="inline" style="align-items:center;">
          <label style="display:inline-flex;align-items:center;gap:.5rem;cursor:pointer;">
            <input
              type="checkbox"
              :checked="allSelected"
              @change="toggleAll(($event.target as HTMLInputElement).checked)"
              aria-label="Tout sélectionner"
            />
            <small class="u-muted">Tout sélectionner</small>
          </label>

          <button
            class="btn"
            :disabled="selectedCount === 0"
            @click="bulkDeleteSelected"
            :aria-disabled="selectedCount === 0"
            :title="selectedCount ? `Supprimer ${selectedCount} sélection(s)` : 'Sélection vide'"
          >
            Supprimer la sélection ({{ selectedCount }})
          </button>

          <button class="btn" @click="handleClearAll">Tout effacer</button>
        </div>
      </div>

      <ul class="stack">
        <li
          v-for="t in tasks"
          :key="t.id"
          class="u-card"
          style="display:flex;justify-content:space-between;align-items:center;"
        >
          <!-- Row selection checkbox -->
          <label style="display:flex;align-items:center;gap:.75rem;flex:1;cursor:pointer;">
            <input
              type="checkbox"
              :checked="selected.has(t.id)"
              @change="toggleOne(t.id, ($event.target as HTMLInputElement).checked)"
              :aria-label="`Sélectionner la tâche ${t.title}`"
            />
            <div>
              <div style="font-weight:600;">{{ t.title }}</div>
              <small class="u-muted">
                <span v-if="t.estMin">{{ formatDuration(t.estMin) }} — </span>
                {{ new Date(t.createdAt).toLocaleString() }}
              </small>
            </div>
          </label>

          <div class="inline">
            <button class="btn">Détails</button>
            <button class="btn" @click="handleDeleteTask(t.id)">Supprimer</button>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

