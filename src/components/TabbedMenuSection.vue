<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenu } from '../composables/useMenu'
import { useSchedule } from '../composables/useSchedule'
import { useCart } from '../composables/useCart'
import { toSlug } from '../utils/slug'
import type { MenuItem } from '../types'

const { menu } = useMenu()
const { schedule } = useSchedule()
const cart = useCart()

const activeEvent = computed(() => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const event of schedule.value) {
    if (!event.date || !event.startTime || !event.endTime) continue
    if (event.date !== today) continue
    if (!event.priceOverrides || Object.keys(event.priceOverrides).length === 0) continue

    const startParts = event.startTime.split(':').map(Number)
    const endParts = event.endTime.split(':').map(Number)
    const startMinutes = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0)
    const endMinutes = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0)

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return event
    }
  }
  return null
})

function getPrice(categoryId: string, item: MenuItem): number {
  if (!activeEvent.value?.priceOverrides) return item.price
  const key = `${categoryId}:${item.name}`
  return activeEvent.value.priceOverrides[key] ?? item.price
}
const route = useRoute()
const router = useRouter()
const activeCategory = ref<string | null>(null)

const defaultCategories = computed(() => {
  const cats = menu.value.categories
  const defaults = cats.filter(c => c.default)
  return defaults.length > 0 ? defaults : cats
})

const isDefaultView = computed(() => activeCategory.value === null)

const singleCategoryItems = computed(() => {
  return menu.value.categories.find(c => c.id === activeCategory.value)?.items ?? []
})

// Flat list of visible items for scroll-to-item logic
const visibleItems = computed(() => {
  if (isDefaultView.value) {
    return defaultCategories.value.flatMap(c => c.items)
  }
  return singleCategoryItems.value
})

// Set active category from route param or default view
watch(
  () => [menu.value.categories, route.params.categoryId] as const,
  ([categories, categoryId]) => {
    if (categories.length === 0) return
    if (categoryId && categories.some(c => c.id === categoryId)) {
      activeCategory.value = categoryId as string
    } else if (!categoryId) {
      activeCategory.value = null
    }
  },
  { immediate: true }
)

function selectCategory(categoryId: string) {
  activeCategory.value = categoryId
  if (route.name === 'menu') {
    router.replace({ name: 'menu', params: { categoryId } })
  }
}

// Scroll to item card when itemSlug param is present
watch(
  () => [route.params.itemSlug, visibleItems.value] as const,
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

      <!-- Default View: grouped by category -->
      <div v-if="isDefaultView">
        <div v-for="category in defaultCategories" :key="category.id" class="mb-10 last:mb-0">
          <h3 class="font-display text-xl font-semibold text-neutral-700 mb-4">{{ category.name }}</h3>
          <div class="grid gap-6 sm:grid-cols-2">
            <div
              v-for="item in category.items"
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
                    :to="{ name: 'menu', params: { categoryId: category.id, itemSlug: toSlug(item.name) } }"
                    class="font-display text-lg font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
                  >
                    {{ item.name }}
                  </router-link>
                  <span class="font-display text-lg font-semibold text-neutral-900">${{ getPrice(category.id, item).toFixed(2) }}</span>
                </div>
                <p v-if="item.description" class="font-body text-sm text-neutral-500 leading-relaxed">{{ item.description }}</p>
                <button
                  @click="cart.addItem(category.id, item.name, getPrice(category.id, item))"
                  class="mt-3 w-full py-1.5 text-sm font-medium font-body bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Single Category View -->
      <div v-else class="grid gap-6 sm:grid-cols-2">
        <div
          v-for="item in singleCategoryItems"
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
              <span class="font-display text-lg font-semibold text-neutral-900">${{ getPrice(activeCategory!, item).toFixed(2) }}</span>
            </div>
            <p v-if="item.description" class="font-body text-sm text-neutral-500 leading-relaxed">{{ item.description }}</p>
            <button
              @click="cart.addItem(activeCategory!, item.name, getPrice(activeCategory!, item))"
              class="mt-3 w-full py-1.5 text-sm font-medium font-body bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <p v-if="menu.footerText" class="font-body text-center text-neutral-500 text-sm mt-8">
        {{ menu.footerText }}
      </p>
    </div>
  </section>
</template>
