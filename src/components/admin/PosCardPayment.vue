<script setup lang="ts">
defineProps<{
  total: number
  loading: boolean
}>()

const emit = defineEmits<{
  complete: []
  cancel: []
}>()
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
      <h3 class="text-lg font-semibold text-center mb-4">External Card Payment</h3>

      <div class="text-center mb-6">
        <p class="text-sm text-neutral-500">Order Total</p>
        <p class="text-2xl font-bold">${{ total.toFixed(2) }}</p>
      </div>

      <p class="text-center text-neutral-600 mb-6">
        Has the card payment been processed on your reader?
      </p>

      <div class="flex gap-2">
        <button
          @click="emit('cancel')"
          class="flex-1 py-3 border border-neutral-300 rounded-lg font-medium text-sm hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          @click="emit('complete')"
          :disabled="loading"
          class="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {{ loading ? 'Processing...' : 'Yes, Complete Order' }}
        </button>
      </div>
    </div>
  </div>
</template>
