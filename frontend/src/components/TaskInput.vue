<script setup lang="ts">
// Emits "add": { title, estMin? }.
import { ref, defineExpose } from "vue";
import { parseDurationToMinutes } from "../utils/parse";

const emit = defineEmits<{
  (e: "add", payload: { title: string; estMin?: number }): void;
}>();

const title = ref("");
const estimation = ref(""); // raw user input (e.g., "1h15", "90", "1:15")
const error = ref("");

// Reference to the title input for autofocus
const titleEl = ref<HTMLInputElement | null>(null);

// Parent will call this method after opening the modal
function focusFirst() {
  titleEl.value?.focus();
}
defineExpose({ focusFirst });

function onSubmit() {
  const t = title.value.trim();
  if (!t) {
    error.value = "Le titre est requis.";
    return;
  }
  let estMin: number | undefined = undefined;
  if (estimation.value.trim() !== "") {
    const parsed = parseDurationToMinutes(estimation.value);
    if (parsed == null) {
      error.value = "Durée invalide. Exemples : 45, 1h, 1h15, 1:15, 90m.";
      return;
    }
    estMin = parsed;
  }
  emit("add", { title: t, estMin });

  // reset form
  title.value = "";
  estimation.value = "";
  error.value = "";
}
</script>

<template>
  <!-- Column form inside modal -->
  <form class="stack" @submit.prevent="onSubmit">
    <!-- Titre -->
    <div class="form-field">
      <label for="task-title" class="u-muted"><small>Titre *</small></label>
      <input
        id="task-title"
        ref="titleEl"
        type="text"
        v-model="title"
        class="form-control"
        placeholder="Nouvelle tâche…"
        required
      />
    </div>

    <!-- Durée -->
    <div class="form-field">
      <label for="task-est" class="u-muted"><small>Durée</small></label>
      <input
        id="task-est"
        type="text"
        v-model="estimation"
        class="form-control"
        placeholder="(ex: 45, 1h15, 1:15)"
        inputmode="numeric"
      />
    </div>

    <small v-if="error" class="u-muted" role="alert">{{ error }}</small>
  </form>
</template>
