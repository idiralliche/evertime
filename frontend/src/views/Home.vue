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
// reactive "original" notes snapshot (for dirty detection)
const notesOriginal = ref<Record<string, string>>({});

const selectedCount = computed(() => selected.value.size);
const allSelected = computed(() => tasks.value.length > 0 && selected.value.size === tasks.value.length);

async function loadTasks() {
  const rows = await listTasks();
  tasks.value = rows.map(toUiTask);
  // keep selection coherent after refresh
  const keep = new Set<string>();
  for (const t of tasks.value) if (selected.value.has(t.id)) keep.add(t.id);
  selected.value = keep;

  // take an "original" snapshot for dirty comparison
  snapshotOriginalNotes();
}

async function handleAddTask(payload: { title: string; estMin?: number }) {
  const created = await createTaskFromInput(payload);
  const ui = toUiTask(created);
  tasks.value.unshift(ui);
  // newly created task has empty notes (original = "")
  notesOriginal.value = { ...notesOriginal.value, [ui.id]: "" };
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
  const gone = new Set(ids);
  tasks.value = tasks.value.filter(t => !gone.has(t.id));
  selected.value = new Set();
  open.value = new Set();

  // shrink original map
  const next: Record<string, string> = {};
  for (const t of tasks.value) next[t.id] = notesOriginal.value[t.id] ?? "";
  notesOriginal.value = next;
}

async function handleDeleteTask(id: string) {
  await deleteTask(id);
  tasks.value = tasks.value.filter(t => t.id !== id);
  const s = new Set(selected.value); s.delete(id); selected.value = s;
  const o = new Set(open.value); o.delete(id); open.value = o;

  // shrink original map
  const next = { ...notesOriginal.value };
  delete next[id];
  notesOriginal.value = next;
}

// persist notes only when dirty; then update original snapshot for that task
async function handleSaveNotes(t: UiTask) {
  if (!isDirty(t)) return;
  await updateTaskNotes(t.id, t.notes);
  // update original to current trimmed notes to clear dirty state
  notesOriginal.value = { ...notesOriginal.value, [t.id]: (t.notes ?? "").trim() };
}

// recompute original map from current tasks (called after loads)
function snapshotOriginalNotes() {
  const obj: Record<string, string> = {};
  for (const t of tasks.value) obj[t.id] = (t.notes ?? "").trim();
  notesOriginal.value = obj; // reassign for reactivity
}

// isDirty when trimmed notes differ from original and not empty
function isDirty(t: UiTask): boolean {
  const cur = (t.notes ?? "").trim();
  const orig = (notesOriginal.value[t.id] ?? "").trim();
  return cur !== orig;
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

        <!-- Panneau accordéon : bloc notes (label au-dessus + bouton icône ghost conditionnel) -->
        <div v-if="open.has(t.id)" class="task-details">
          <!-- header row: label (left) + save icon (right, only when dirty) -->
          <div class="inline" style="align-items:center;">
            <label :for="`notes-${t.id}`" class="u-muted"><small>Notes</small></label>

            <!-- Icon-only Save, ghost, ONLY when text is newly entered (= dirty) -->
            <button
              v-if="isDirty(t)"
              class="btn btn--icon btn--ghost u-ml-auto"
              @click="handleSaveNotes(t)"
              title="Enregistrer (vide = supprimer)"
              aria-label="Enregistrer"
            >
              <i-lucide-save aria-hidden="true" />
            </button>
          </div>

          <!-- same style as TaskInput inputs -->
          <textarea
            :id="`notes-${t.id}`"
            v-model="t.notes"
            rows="3"
            class="u-radius"
            placeholder="Notes (facultatif)"
            aria-label="Notes pour la tâche"
          ></textarea>
        </div>

      </li>
    </ul>
  </section>
</template>

