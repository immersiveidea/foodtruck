<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  total: number
  loading: boolean
}>()

const emit = defineEmits<{
  complete: [cashTendered: number]
  cancel: []
}>()

const tendered = ref(0)

const change = computed(() => {
  if (tendered.value < props.total) return 0
  return Math.round((tendered.value - props.total) * 100) / 100
})

const canComplete = computed(() => tendered.value >= props.total)

const denominations = [
  { label: '$100', value: 100 },
  { label: '$50', value: 50 },
  { label: '$20', value: 20 },
  { label: '$10', value: 10 },
  { label: '$5', value: 5 },
  { label: '$1', value: 1 },
  { label: '$0.25', value: 0.25 },
  { label: '$0.10', value: 0.10 },
  { label: '$0.05', value: 0.05 },
]

function addDenomination(value: number) {
  tendered.value = Math.round((tendered.value + value) * 100) / 100
}

function setExact() {
  tendered.value = props.total
}

function clearTendered() {
  tendered.value = 0
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
      <h3 class="text-lg font-semibold text-center mb-4">Cash Payment</h3>

      <div class="text-center mb-4">
        <p class="text-sm text-neutral-500">Order Total</p>
        <p class="text-2xl font-bold">${{ total.toFixed(2) }}</p>
      </div>

      <!-- Denomination buttons -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <button
          v-for="d in denominations"
          :key="d.value"
          @click="addDenomination(d.value)"
          class="py-3 bg-neutral-100 rounded-lg font-medium text-sm hover:bg-neutral-200 active:bg-neutral-300"
        >
          {{ d.label }}
        </button>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          @click="setExact"
          class="flex-1 py-2 bg-neutral-100 rounded-lg text-sm font-medium hover:bg-neutral-200"
        >
          Exact
        </button>
        <button
          @click="clearTendered"
          class="flex-1 py-2 bg-neutral-100 rounded-lg text-sm font-medium hover:bg-neutral-200"
        >
          Clear
        </button>
      </div>

      <!-- Tendered & Change -->
      <div class="bg-neutral-50 rounded-lg p-4 mb-4 space-y-2">
        <div class="flex justify-between">
          <span class="text-neutral-500">Tendered</span>
          <span class="font-semibold">${{ tendered.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-neutral-500">Change</span>
          <span :class="['font-semibold', canComplete ? 'text-green-600 text-lg' : 'text-neutral-400']">
            ${{ change.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button
          @click="emit('cancel')"
          class="flex-1 py-3 border border-neutral-300 rounded-lg font-medium text-sm hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          @click="emit('complete', tendered)"
          :disabled="!canComplete || loading"
          class="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Processing...' : 'Complete Sale' }}
        </button>
      </div>
    </div>
  </div>
</template>
