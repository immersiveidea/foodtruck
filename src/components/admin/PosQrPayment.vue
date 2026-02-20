<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { useAdminApi } from '../../composables/useAdminApi'
import type { PosOrderItem } from '../../composables/usePosOrder'

const props = defineProps<{
  total: number
  items: PosOrderItem[]
}>()

const emit = defineEmits<{
  complete: [orderId: string]
  cancel: []
}>()

const { adminFetch } = useAdminApi()

const loading = ref(true)
const error = ref<string | null>(null)
const qrDataUrl = ref('')
const status = ref<'loading' | 'waiting' | 'paid' | 'error'>('loading')

let pollInterval: ReturnType<typeof setInterval> | null = null
let sessionId = ''
let orderId = ''

onMounted(async () => {
  try {
    // Create Checkout Session
    const res = await adminFetch('/api/admin/pos-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: props.items.map(i => ({
          categoryId: i.categoryId,
          itemName: i.itemName,
          quantity: i.quantity
        }))
      })
    })

    const data = await res.json() as { success: boolean; url?: string; sessionId?: string; orderId?: string; error?: string }
    if (!data.success || !data.url) {
      throw new Error(data.error || 'Failed to create checkout session')
    }

    sessionId = data.sessionId!
    orderId = data.orderId!

    // Generate QR code from the checkout URL
    qrDataUrl.value = await QRCode.toDataURL(data.url, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })

    status.value = 'waiting'

    // Poll for payment completion
    pollInterval = setInterval(async () => {
      try {
        const pollRes = await fetch(`/api/orders?session_id=${encodeURIComponent(sessionId)}`)
        if (pollRes.ok) {
          const order = await pollRes.json() as { status: string }
          if (order.status === 'paid' || order.status === 'fulfilled') {
            status.value = 'paid'
            if (pollInterval) clearInterval(pollInterval)
            emit('complete', orderId)
          }
        }
      } catch {
        // Silently retry on poll errors
      }
    }, 2000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create QR code'
    status.value = 'error'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
      <h3 class="text-lg font-semibold text-center mb-4">QR Code Payment</h3>

      <div class="text-center mb-4">
        <p class="text-sm text-neutral-500">Order Total</p>
        <p class="text-2xl font-bold">${{ total.toFixed(2) }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-2"></div>
        <p class="text-sm text-neutral-500">Generating QR code...</p>
      </div>

      <!-- QR Code -->
      <div v-if="status === 'waiting'" class="text-center">
        <div class="inline-block p-2 bg-white border-2 border-neutral-200 rounded-lg mb-4">
          <img :src="qrDataUrl" alt="Payment QR Code" class="w-48 h-48" />
        </div>
        <p class="text-neutral-600 text-sm mb-2">Scan with phone to pay</p>
        <div class="flex items-center justify-center gap-2 text-neutral-400 text-sm">
          <div class="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
          Waiting for payment...
        </div>
      </div>

      <!-- Paid -->
      <div v-if="status === 'paid'" class="text-center py-4">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="font-semibold text-green-600">Payment received!</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
        {{ error }}
      </div>

      <!-- Cancel button -->
      <div class="mt-4">
        <button
          @click="emit('cancel')"
          class="w-full py-3 border border-neutral-300 rounded-lg font-medium text-sm hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
