<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMenu } from '../composables/useMenu'

const { menu } = useMenu()
const activeCategory = ref<string>('')

// Set initial active category when menu loads
watch(
  () => menu.value.categories,
  (categories) => {
    if (categories.length > 0 && !activeCategory.value) {
      activeCategory.value = categories[0]!.id
    }
  },
  { immediate: true }
)

const activeItems = computed(() => {
  return menu.value.categories.find(c => c.id === activeCategory.value)?.items ?? []
})
</script>

<template>
  <section id="menu" class="bg-neutral-50 px-4 py-12 md:py-20 md:px-8">
    <div class="max-w-4xl mx-auto">
      <h2 class="font-display text-3xl md:text-4xl font-semibold text-neutral-800 mb-8 text-center">Menu</h2>

      <!-- Category Tabs -->
      <div class="flex flex-wrap justify-center gap-2 mb-8">
        <button
          v-for="category in menu.categories"
          :key="category.id"
          @click="activeCategory = category.id"
          :class="[
            'font-body text-sm font-medium px-4 py-2 rounded-full border transition-all',
            activeCategory === category.id
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900'
          ]"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Menu Items Grid -->
      <div class="grid gap-6 sm:grid-cols-2">
        <div
          v-for="item in activeItems"
          :key="item.name"
          class="bg-white rounded-lg p-5 shadow-sm border border-neutral-100"
        >
          <h3 class="font-display text-lg font-semibold text-neutral-900 mb-2">{{ item.name }}</h3>
          <p class="font-body text-sm text-neutral-500 leading-relaxed">{{ item.description }}</p>
        </div>
      </div>

      <p class="font-body text-center text-neutral-500 text-sm mt-8">
        Add tapioca pearls, popping boba, grass jelly, or other toppings to any drink!
      </p>
    </div>
  </section>
</template>
