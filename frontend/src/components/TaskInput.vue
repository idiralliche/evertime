<script setup lang="ts">
// Emits an "add" event with minimal payload { title, estMin }.
import { ref } from "vue";

const title = ref("");
const estMin = ref<number | undefined>();

const emit = defineEmits<{
  (e: "add", payload: { title: string; estMin?: number }): void;
}>();

function submit() {
  const t = title.value.trim();
  if (!t) return;
  emit("add", { title: t, estMin: estMin.value });
  title.value = "";
  estMin.value = undefined;
}
</script>

<template>
  <form class="u-gap-4" style="display:flex; align-items:flex-start;" @submit.prevent="submit">
    <div class="stack" style="flex:1;">
      <label for="task-title" class="u-muted">Titre</label>
      <input
        id="task-title"
        v-model="title"
        type="text"
        placeholder="Ex. : Appeler le dentiste"
        class="u-radius"
        style="width:100%; border:1px solid var(--color-muted); padding:.6rem .8rem; background:var(--color-surface);"
        @keyup.enter="submit"
      />
    </div>

    <div class="stack" style="width:9rem;">
      <label for="task-est" class="u-muted">Durée (min)</label>
      <input
        id="task-est"
        v-model.number="estMin"
        type="number"
        min="1"
        placeholder="25"
        class="u-radius"
        style="width:100%; border:1px solid var(--color-muted); padding:.6rem .8rem; background:var(--color-surface);"
        @keyup.enter="submit"
      />
    </div>

    <div class="stack" style="margin-top:1.5rem;">
      <button type="submit" class="btn btn--primary">Ajouter</button>
    </div>
  </form>
</template>
