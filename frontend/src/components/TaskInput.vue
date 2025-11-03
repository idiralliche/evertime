<script setup lang="ts">
// Emits an "add" event with minimal payload { title, estMin }.
import { ref } from "vue";
import { parseDurationToMinutes } from "../utils/parse";

const emit = defineEmits<{
  (e: "add", payload: { title: string; estMin?: number; notes?: string }): void;
}>();

const title = ref("");
const estimation = ref(""); // raw user input (e.g., "1h15", "90", "1:15")
const notes = ref("");
const error = ref("");

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
  const n = notes.value.trim();
  emit("add", { title: t, estMin, notes: n || undefined });

  // reset form
  title.value = "";
  estimation.value = "";
  notes.value = "";
  error.value = "";
}
</script>

<template>
  <!-- Column layout: row (title/duration/button) + row (notes) -->
  <form class="inline u-flex u-gap-4" @submit.prevent="onSubmit">
    <input
      type="text"
      v-model="title"
      placeholder="Nouvelle tâche…"
      aria-label="Titre de la tâche"
      class="u-radius"
      required
    />
    <input
      type="text"
      v-model="estimation"
      placeholder="Durée (ex: 45, 1h15, 1:15)"
      aria-label="Durée estimée"
      inputmode="numeric"
      class="u-radius"
    />
    <textarea
      id="task-notes"
      v-model="notes"
      rows="1"
      class="u-radius"
      placeholder="Notes (facultatif)…"
      aria-label="Notes de la tâche"
    ></textarea>
    <!-- push this button to the far right -->
    <button type="submit" class="btn btn--primary u-ml-auto">Ajouter</button>
  </form>
  <small v-if="error" class="u-muted" role="alert">{{ error }}</small>
</template>
