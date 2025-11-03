<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import TaskInput from "../components/TaskInput.vue";
import { listTasks, createTaskFromInput, deleteTask, deleteTasks, updateTaskNotes } from "../db";
import type { DbTask } from "../db";
import { formatDuration } from "../utils/format";
import { decodeCiphertext, decodeOptionalCiphertext } from "../codec/taskCiphertext";

type UiTask = {
  id: string;
  title: string;
  estMin?: number;
  createdAt: string;
  notes: string;
};

function toUiTask(db: DbTask): UiTask {
  return {
    id: db.id,
    title: decodeCiphertext(db.title_ciphertext),
    estMin: db.est_duration_min ?? undefined,
    createdAt: db.created_at,
    notes: decodeOptionalCiphertext(db.notes_ciphertext),
  };
}

const tasks = ref<UiTask[]>([]);
const selected = ref<Set<string>>(new Set());
const open = ref<Set<string>>(new Set());
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
  selected.value = next;
}

function toggleAll(checked: boolean) {
  selected.value = checked ? new Set(tasks.value.map(t => t.id)) : new Set();
}

function toggleOpen(id: string) {
  const n = new Set(open.value);
  n.has(id) ? n.delete(id) : n.add(id);
  open.value = n;
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

async function handleSaveNotes(t: UiTask) {
  await updateTaskNotes(t.id, t.notes);
  // No reload needed; UI already has the latest plain notes.
}

onMounted(() => { void loadTasks(); });
</script>

<template>
  <section class="section app">
    <header class="stack">
      <h1>EverTime</h1>
      <p class="u-muted">Capture rapide des tâches (MVP)</p>
    </header>

    <div class="task-toolbar">
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
        :title="selectedCount ? `Supprimer la sélection (${selectedCount})` : 'Sélection vide'"
      >
        Supprimer la sélection ({{ selectedCount }})
      </button>
    </div>

    <!-- Bloc de saisie -->
    <div class="u-card stack" style="margin-top: var(--space-4);">
      <TaskInput @add="handleAddTask" />
    </div>

    <!-- Liste en accordéon alignée à gauche -->
    <ul class="stack" style="margin-top: var(--space-4);">
      <li
        v-for="t in tasks"
        :key="t.id"
        class="u-card"
        style="display:flex; flex-direction:column; gap: var(--space-3); text-align:left;"
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap: var(--space-4);">
          <label style="display:flex; align-items:center; gap:.75rem; flex:1; cursor:pointer;">
            <input
              type="checkbox"
              :checked="selected.has(t.id)"
              @change="toggleOne(t.id, ($event.target as HTMLInputElement).checked)"
              :aria-label="`Sélectionner la tâche ${t.title}`"
            />
            <div style="font-weight:600;">
              {{ t.title }}
              <span v-if="t.estMin" class="u-muted"> — {{ formatDuration(t.estMin) }}</span>
            </div>
          </label>

          <div class="inline">
            <button
              class="btn btn--icon btn--ghost"
              :title="open.has(t.id) ? 'Masquer les détails' : 'Détails'"
              @click="toggleOpen(t.id)"
              aria-label="Détails"
            >
              <i-lucide-chevron-up v-if="open.has(t.id)" aria-hidden="true" />
              <i-lucide-chevron-down v-else aria-hidden="true" />
            </button>

            <button
              class="btn btn--icon btn--ghost"
              title="Supprimer"
              aria-label="Supprimer"
              @click="handleDeleteTask(t.id)"
            >
              <i-lucide-trash-2 aria-hidden="true" />
          </button>
          </div>
        </div>

        <div v-if="open.has(t.id)" class="task-details">
          <label :for="`notes-${t.id}`" class="u-muted"><small>Notes</small></label>
          <textarea
            :id="`notes-${t.id}`"
            v-model="t.notes"
            rows="3"
            class="u-radius"
            placeholder="Notes (facultatif)"
            aria-label="Notes pour la tâche"
          ></textarea>

          <div class="inline" style="justify-content:flex-end;">
            <button class="btn btn--icon btn--ghost" @click="handleSaveNotes(t)" title="Enregistrer les détails" aria-label="Enregistrer">
              <i-lucide-save aria-hidden="true" />
            </button>
          </div>
        </div>

      </li>
    </ul>
  </section>
</template>

