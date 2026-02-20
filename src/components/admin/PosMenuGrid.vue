<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MenuData } from '../../types'

const props = defineProps<{
  menuData: MenuData
}>()

const emit = defineEmits<{
  addItem: [categoryId: string, itemName: string, unitPrice: number]
}>()

const activeCategoryId = ref<string | null>(null)

const categories = computed(() => props.menuData.categories || [])

const activeCategory = computed(() => {
  if (!categories.value.length) return null
  if (activeCategoryId.value) {
    return categories.value.find(c => c.id === activeCategoryId.value) || categories.value[0]
  }
  return categories.value[0]
})

function selectCategory(id: string) {
  activeCategoryId.value = id
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Category tabs -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-1 flex-shrink-0">
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="selectCategory(cat.id)"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap text-sm',
          activeCategory?.id === cat.id
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
        ]"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Items grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto flex-1">
      <button
        v-for="item in activeCategory?.items"
        :key="item.name"
        @click="emit('addItem', activeCategory!.id, item.name, item.price)"
        class="bg-white border border-neutral-200 rounded-lg p-4 text-left hover:border-neutral-400 hover:shadow-sm active:bg-neutral-50 transition-all"
      >
        <p class="font-medium text-neutral-900 text-sm leading-tight">{{ item.name }}</p>
        <p class="text-neutral-500 text-sm mt-1">${{ item.price.toFixed(2) }}</p>
      </button>
    </div>

    <div v-if="!categories.length" class="flex items-center justify-center flex-1 text-neutral-400">
      No menu items available
    </div>
  </div>
</template>
