<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
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

const loading = ref(true)
const error = ref<string | null>(null)
const status = ref<'creating' | 'waiting' | 'completed' | 'error'>('creating')

let orderId = ''
let terminalPaymentId = ''
let pollInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  try {
    // Create terminal checkout on Square device
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

    const data = await res.json() as {
      success: boolean
      terminalPaymentId?: string
      orderId?: string
      error?: string
    }

    if (!data.success || !data.terminalPaymentId) {
      throw new Error(data.error || 'Failed to create terminal payment')
    }

    orderId = data.orderId!
    terminalPaymentId = data.terminalPaymentId
    status.value = 'waiting'
    loading.value = false

    // Poll for payment completion
    pollInterval = setInterval(async () => {
      try {
        const pollRes = await adminFetch(
          `/api/admin/pos-terminal-status?id=${encodeURIComponent(terminalPaymentId)}`
        )
        const pollData = await pollRes.json() as { status: string; providerPaymentId?: string }

        if (pollData.status === 'completed') {
          status.value = 'completed'
          if (pollInterval) clearInterval(pollInterval)
          emit('complete', orderId)
        } else if (pollData.status === 'cancelled' || pollData.status === 'error') {
          status.value = 'error'
          error.value = 'Payment was cancelled or failed on the terminal'
          if (pollInterval) clearInterval(pollInterval)
        }
      } catch {
        // Silently retry on poll errors
      }
    }, 2000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create terminal payment'
    status.value = 'error'
    loading.value = false
  }
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

async function handleCancel() {
  if (pollInterval) clearInterval(pollInterval)

  if (terminalPaymentId) {
    try {
      await adminFetch('/api/admin/pos-terminal-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: terminalPaymentId })
      })
    } catch {
      // Best effort cancel
    }
  }

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

      <!-- Loading / Creating -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-2"></div>
        <p class="text-sm text-neutral-500">Sending to terminal...</p>
      </div>

      <!-- Waiting for card -->
      <div v-else-if="status === 'waiting'" class="text-center py-8">
        <div class="inline-block w-12 h-12 mb-3">
          <svg class="w-12 h-12 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <p class="text-neutral-700 font-medium">Waiting for payment on terminal...</p>
        <p class="text-sm text-neutral-500 mt-1">Tap, insert, or swipe card on device</p>
        <div class="flex items-center justify-center gap-2 text-neutral-400 text-sm mt-3">
          <div class="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
          Polling for status...
        </div>
      </div>

      <!-- Completed -->
      <div v-else-if="status === 'completed'" class="text-center py-4">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="font-semibold text-green-600">Payment complete!</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-4">
        <div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {{ error }}
        </div>
      </div>

      <!-- Cancel button -->
      <div v-if="!loading && status !== 'completed'" class="mt-4">
        <button
          @click="handleCancel"
          class="w-full py-3 border border-neutral-300 rounded-lg font-medium text-sm hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
