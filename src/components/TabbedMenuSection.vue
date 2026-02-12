<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenu } from '../composables/useMenu'
import { toSlug } from '../utils/slug'

const { menu } = useMenu()
const route = useRoute()
const router = useRouter()
const activeCategory = ref<string>('')

// Set active category from route param or default to first
watch(
  () => [menu.value.categories, route.params.categoryId] as const,
  ([categories, categoryId]) => {
    if (categories.length === 0) return
    if (categoryId && categories.some(c => c.id === categoryId)) {
      activeCategory.value = categoryId as string
    } else if (!activeCategory.value) {
      activeCategory.value = categories[0]!.id
    }
  },
  { immediate: true }
)

const activeItems = computed(() => {
  return menu.value.categories.find(c => c.id === activeCategory.value)?.items ?? []
})

function selectCategory(categoryId: string) {
  activeCategory.value = categoryId
  if (route.name === 'menu') {
    router.replace({ name: 'menu', params: { categoryId } })
  }
}

// Scroll to item card when itemSlug param is present
watch(
  () => [route.params.itemSlug, activeItems.value] as const,
  async ([itemSlug, items]) => {
    if (!itemSlug || items.length === 0) return
    await nextTick()
    const el = document.getElementById('menu-item-' + itemSlug)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-neutral-400')
      setTimeout(() => el.classList.remove('ring-2', 'ring-neutral-400'), 2000)
    }
  },
  { immediate: true }
)
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
          @click="selectCategory(category.id)"
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
          :id="'menu-item-' + toSlug(item.name)"
          class="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden transition-shadow"
        >
          <div v-if="item.imageKey" class="relative h-40 bg-neutral-100 overflow-hidden">
            <img
              :src="`/api/images/${item.imageKey}`"
              :alt="item.name"
              class="absolute w-full"
              :style="{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${item.imageScale || 1})`
              }"
            />
          </div>
          <div class="p-5">
            <div class="flex justify-between items-start mb-2">
              <router-link
                :to="{ name: 'menu', params: { categoryId: activeCategory, itemSlug: toSlug(item.name) } }"
                class="font-display text-lg font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
              >
                {{ item.name }}
              </router-link>
              <span class="font-display text-lg font-semibold text-neutral-900">${{ item.price.toFixed(2) }}</span>
            </div>
            <p v-if="item.description" class="font-body text-sm text-neutral-500 leading-relaxed">{{ item.description }}</p>
          </div>
        </div>
      </div>

      <p v-if="menu.footerText" class="font-body text-center text-neutral-500 text-sm mt-8">
        {{ menu.footerText }}
      </p>
    </div>
  </section>
</template>
