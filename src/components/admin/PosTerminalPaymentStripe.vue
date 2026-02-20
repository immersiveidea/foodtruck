<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { usePosTerminal } from '../../composables/usePosTerminal'
import type { PosOrderItem } from '../../composables/usePosOrder'

const props = defineProps<{
  total: number
  items: PosOrderItem[]
  customerName: string
}>()

const emit = defineEmits<{
  complete: [orderId: string]
  cancel: []
}>()

const { adminFetch } = useAdminApi()
const { paymentStatus, error: terminalError, collectPayment, cancelCollect } = usePosTerminal()

const loading = ref(true)
const error = ref<string | null>(null)
let orderId = ''
let clientSecret = ''

onMounted(async () => {
  try {
    const res = await adminFetch('/api/admin/pos-terminal-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: props.items.map(i => ({
          categoryId: i.categoryId,
          itemName: i.itemName,
          quantity: i.quantity
        })),
        customerName: props.customerName || undefined
      })
    })

    const data = await res.json() as { success: boolean; clientSecret?: string; orderId?: string; error?: string }
    if (!data.success || !data.clientSecret) {
      throw new Error(data.error || 'Failed to create payment')
    }

    orderId = data.orderId!
    clientSecret = data.clientSecret
    loading.value = false

    await startCollection()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to initialize payment'
    loading.value = false
  }
})

async function startCollection() {
  error.value = null
  const result = await collectPayment(clientSecret)

  if (result.success) {
    emit('complete', orderId)
  } else if (result.error && result.error !== 'canceled') {
    error.value = result.error
  }
}

async function handleRetry() {
  await startCollection()
}

function handleCancel() {
  cancelCollect()
  emit('cancel')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
      <h3 class="text-lg font-semibold text-center mb-4">Terminal Payment</h3>

      <div class="text-center mb-4">
        <p class="text-sm text-neutral-500">Order Total</p>
        <p class="text-2xl font-bold">${{ total.toFixed(2) }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-2"></div>
        <p class="text-sm text-neutral-500">Creating payment...</p>
      </div>

      <!-- Waiting for card -->
      <div v-else-if="paymentStatus === 'waiting_for_card'" class="text-center py-8">
        <div class="inline-block w-12 h-12 mb-3">
          <svg class="w-12 h-12 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <p class="text-neutral-700 font-medium">Present card on reader</p>
        <p class="text-sm text-neutral-500 mt-1">Tap, insert, or swipe</p>
      </div>

      <!-- Processing -->
      <div v-else-if="paymentStatus === 'processing'" class="text-center py-8">
        <div class="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-2"></div>
        <p class="text-sm text-neutral-500">Processing payment...</p>
      </div>

      <!-- Error / Declined -->
      <div v-else-if="error || terminalError" class="text-center py-4">
        <div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {{ error || terminalError }}
        </div>
        <p class="text-sm text-neutral-500 mb-4">Try another card or cancel</p>
      </div>

      <!-- Actions -->
      <div v-if="!loading" class="flex gap-2">
        <button
          @click="handleCancel"
          class="flex-1 py-3 border border-neutral-300 rounded-lg font-medium text-sm hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          v-if="error || terminalError"
          @click="handleRetry"
          class="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  </div>
</template>
