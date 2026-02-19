<script setup lang="ts">
import type { MenuData, ScheduleLocation } from '../../types'

const props = defineProps<{
  event: ScheduleLocation
  menuCategories: MenuData['categories']
}>()

const emit = defineEmits<{ 'update:event': [event: ScheduleLocation] }>()

const showEventPricing = defineModel<boolean>('showPricing', { default: false })

function getOverridePrice(categoryId: string, itemName: string): number | null {
  const key = `${categoryId}:${itemName}`
  return props.event.priceOverrides?.[key] ?? null
}

function setOverridePrice(categoryId: string, itemName: string, value: string) {
  const key = `${categoryId}:${itemName}`
  const updated = { ...props.event }
  if (value === '' || value === null || value === undefined) {
    if (updated.priceOverrides) {
      delete updated.priceOverrides[key]
      if (Object.keys(updated.priceOverrides).length === 0) delete updated.priceOverrides
    }
  } else {
    if (!updated.priceOverrides) updated.priceOverrides = {}
    updated.priceOverrides[key] = parseFloat(value)
  }
  emit('update:event', updated)
}

function clearAllOverrides() {
  const updated = { ...props.event }
  delete updated.priceOverrides
  emit('update:event', updated)
}
</script>

<template>
  <div class="border border-neutral-200 rounded-lg">
    <button @click="showEventPricing = !showEventPricing" class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg">
      <span>
        Event Pricing
        <span v-if="event.priceOverrides && Object.keys(event.priceOverrides).length > 0" class="ml-1 text-xs text-neutral-500">
          ({{ Object.keys(event.priceOverrides).length }} override{{ Object.keys(event.priceOverrides).length !== 1 ? 's' : '' }})
        </span>
      </span>
      <span class="text-neutral-400">{{ showEventPricing ? '▲' : '▼' }}</span>
    </button>
    <div v-if="showEventPricing" class="px-4 pb-4 space-y-4">
      <p class="text-xs text-neutral-400">Set custom prices for this event. Leave blank to use the default menu price.</p>
      <div v-for="category in menuCategories" :key="category.id">
        <h4 class="text-sm font-medium text-neutral-600 mb-2">{{ category.name }}</h4>
        <div class="space-y-2">
          <div v-for="item in category.items" :key="item.name" class="flex items-center gap-3">
            <span class="text-sm text-neutral-700 flex-1">{{ item.name }}</span>
            <span class="text-xs text-neutral-400 w-16 text-right">${{ item.price.toFixed(2) }}</span>
            <input type="number" step="0.01" min="0" :value="getOverridePrice(category.id, item.name)" @input="setOverridePrice(category.id, item.name, ($event.target as HTMLInputElement).value)" class="w-24 rounded border border-neutral-300 px-2 py-1 text-sm" placeholder="Default" />
          </div>
        </div>
      </div>
      <button v-if="event.priceOverrides && Object.keys(event.priceOverrides).length > 0" @click="clearAllOverrides" class="text-xs text-red-600 hover:text-red-700">Clear All Overrides</button>
    </div>
  </div>
</template>
