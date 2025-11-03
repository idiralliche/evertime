<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import TaskInput from "../components/TaskInput.vue";
import { listTasks, createTaskFromInput, deleteTask, deleteTasks } from "../db";
import type { DbTask } from "../db";
import { formatDuration } from "../utils/format";
import { decodeCiphertext } from "../codec/taskCiphertext";

type UiTask = {
  id: string;
  title: string;
  estMin?: number;
  createdAt: string;
};

function toUiTask(db: DbTask): UiTask {
  return {
    id: db.id,
    title: decodeCiphertext(db.title_ciphertext),
    estMin: db.est_duration_min ?? undefined,
    createdAt: db.created_at,
  };
}

const tasks = ref<UiTask[]>([]);
const selected = ref<Set<string>>(new Set());
const open = ref<Set<string>>(new Set());

const selectedCount = computed(() => selected.value.size);
const allSelected = computed(() => tasks.value.length > 0 && selected.value.size === tasks.value.length);

const isModalOpen = ref(false);
let pushedHistory = false;

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
  closeModal();
}

function toggleOne(id: string, checked: boolean) {
  const next = new Set(selected.value);
  if (checked) next.add(id); else next.delete(id);
  selected.value = next;
}

function toggleAll(checked: boolean) {
  selected.value = checked ? new Set(tasks.value.map(t => t.id)) : new Set();
}

async function bulkDeleteSelected() {
  const ids = Array.from(selected.value);
  if (!ids.length) return;
  if (!confirm(`Supprimer ${ids.length} tâche(s) sélectionnée(s) ?`)) return;
  await deleteTasks(ids);
  const gone = new Set(ids);
  tasks.value = tasks.value.filter(t => !gone.has(t.id));
  selected.value = new Set();
  open.value = new Set();
}

async function handleDeleteTask(id: string) {
  await deleteTask(id);
  tasks.value = tasks.value.filter(t => t.id !== id);
  const s = new Set(selected.value); s.delete(id); selected.value = s;
  const o = new Set(open.value); o.delete(id); open.value = o;
}

// Ref to child component to call focusFirst()
const taskInputRef = ref<InstanceType<typeof TaskInput> | null>(null);

function openModal() {
  isModalOpen.value = true;
  try {
    history.pushState({ modal: true }, "", "#new-task");
    pushedHistory = true;
  } catch {}
  // Wait for modal & child to render, then focus the Title
  void nextTick(() => taskInputRef.value?.focusFirst());
}

function closeModal() {
  isModalOpen.value = false;
  if (pushedHistory) {
    try { history.back(); } catch {}
    pushedHistory = false;
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && isModalOpen.value) closeModal();
}
function onPopState() {
  if (isModalOpen.value) isModalOpen.value = false;
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("popstate", onPopState);
  void loadTasks();
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("popstate", onPopState);
});
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
      <button
        class="btn btn--primary btn--plus"
        @click="openModal"
        title="Ajouter une tâche"
        aria-label="Ajouter une tâche"
        style="margin-left: var(--space-4);"
      >
        <i-lucide-plus aria-hidden="true" />
      </button>
    </div>

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
              title="Supprimer"
              aria-label="Supprimer"
              @click="handleDeleteTask(t.id)"
            >
              <i-lucide-trash-2 aria-hidden="true" />
          </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- MODALE -->
    <div v-if="isModalOpen" class="modal" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
      <div class="modal__overlay" @click="closeModal" />
      <div class="modal__content">
        <div class="modal__header">
          <div id="new-task-title" class="modal__title">Nouvelle tâche</div>
          <button class="btn btn--icon btn--ghost modal__close" @click="closeModal" aria-label="Fermer">
            <i-lucide-x aria-hidden="true" />
          </button>
        </div>
        <!-- TaskInput -->
        <TaskInput ref="taskInputRef" @add="handleAddTask" />
      </div>
    </div>

  </section>
</template>

