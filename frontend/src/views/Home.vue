<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import TaskInput from "../components/TaskInput.vue";
import { tasksRepo } from "../data/tasks.repo";
import { formatDuration } from "../utils/format";

type UiTask = {
  id: string;
  title: string;
  estMin?: number;
  createdAt: string;
};

const tasks = ref<UiTask[]>([]);
const selected = ref<Set<string>>(new Set());
const open = ref<Set<string>>(new Set());

const selectedCount = computed(() => selected.value.size);
const allSelected = computed(() => tasks.value.length > 0 && selected.value.size === tasks.value.length);

const isModalOpen = ref(false);
let pushedHistory = false;

// Modal a11y refs
const mainEl = ref<HTMLElement | null>(null);
const modalContentEl = ref<HTMLElement | null>(null);
const plusBtnRef = ref<HTMLButtonElement | null>(null);
const lastFocused = ref<HTMLElement | null>(null);

async function loadTasks() {
  tasks.value = await tasksRepo.list();
  // keep selection coherent after refresh
  const keep = new Set<string>();
  for (const t of tasks.value) if (selected.value.has(t.id)) keep.add(t.id);
  selected.value = keep;
}

async function handleAddTask(payload: { title: string; estMin?: number }) {
  const created = await tasksRepo.create(payload);
  tasks.value.unshift(created);
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
  await tasksRepo.deleteMany(ids);
  const gone = new Set(ids);
  tasks.value = tasks.value.filter(t => !gone.has(t.id));
  selected.value = new Set();
  open.value = new Set();
}

async function handleDeleteTask(id: string) {
  await tasksRepo.deleteOne(id);
  tasks.value = tasks.value.filter(t => t.id !== id);
  const s = new Set(selected.value); s.delete(id); selected.value = s;
  const o = new Set(open.value); o.delete(id); open.value = o;
}

// Ref to child component to call focusFirst()
const taskInputRef = ref<InstanceType<typeof TaskInput> | null>(null);

// Focus trap handler
function onTrapFocus(e: KeyboardEvent) {
  if (e.key !== "Tab" || !modalContentEl.value) return;

  const node = modalContentEl.value;

  const focusables = node.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const count = focusables.length;
  if (count === 0) return;

  // Use .item() and guard for null to satisfy TS strictness
  const first = focusables.item(0);
  const last = focusables.item(count - 1);
  if (!first || !last) return;

  const active = (document.activeElement as HTMLElement | null) ?? null;
  const isInside = !!(active && node.contains(active));

  if (e.shiftKey) {
    // Shift+Tab on first OR when focus isn't inside -> loop to last
    if (!isInside || active === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    // Tab on last -> loop to first
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function openModal() {
  lastFocused.value = (document.activeElement as HTMLElement) || null;
  isModalOpen.value = true;
  try {
    history.pushState({ modal: true }, "", "#new-task");
    pushedHistory = true;
  } catch {}

  void nextTick(() => {
    // lock background and hide it to AT
    document.body.style.overflow = "hidden";
    mainEl.value?.setAttribute("aria-hidden", "true");

    // start trapping
    modalContentEl.value?.addEventListener("keydown", onTrapFocus);

    // autofocus Title field
    taskInputRef.value?.focusFirst();
  });
}

function closeModal() {
  // stop trapping
  modalContentEl.value?.removeEventListener("keydown", onTrapFocus);

  // unlock background
  document.body.style.overflow = "";
  mainEl.value?.removeAttribute("aria-hidden");

  isModalOpen.value = false;
  if (pushedHistory) {
    try {
      history.back();
    } catch {}
    pushedHistory = false;
  }
  // restore focus to the + button (or last focused)
  (plusBtnRef.value ?? lastFocused.value)?.focus?.();
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
  // safety: remove listeners & unlock if unmounted while open
  modalContentEl.value?.removeEventListener("keydown", onTrapFocus);
  document.body.style.overflow = "";
  mainEl.value?.removeAttribute("aria-hidden");
});
</script>

<template>
  <section class="section app">
    <div ref="mainEl">
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
          ref="plusBtnRef"
          class="btn btn--plus"
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
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
      <div class="modal__overlay" @click="closeModal" />
      <div class="modal__content" ref="modalContentEl">
        <div class="modal__header">
          <div id="new-task-title" class="modal__title">Nouvelle tâche</div>
          <button class="btn btn--icon btn--ghost modal__close" @click="closeModal" aria-label="Fermer">
            <i-lucide-x aria-hidden="true" />
          </button>
        </div>
        <TaskInput ref="taskInputRef" @add="handleAddTask" />
      </div>
    </div>
  </section>
</template>
