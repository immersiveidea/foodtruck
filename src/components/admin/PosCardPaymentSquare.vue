<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { usePaymentProvider } from '../../composables/usePaymentProvider'
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
const { config } = usePaymentProvider()

const loading = ref(true)
const paying = ref(false)
const error = ref<string | null>(null)

let card: { tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>; destroy(): void } | null = null

onMounted(async () => {
  try {
    const applicationId = config.value?.applicationId
    const locationId = config.value?.locationId
    if (!applicationId || !locationId) {
      throw new Error('Square configuration not available')
    }

    // Load Square Web Payments SDK
    const sdkUrl = config.value?.environment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'

    await new Promise<void>((resolve, reject) => {
      if ((window as unknown as Record<string, unknown>).Square) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = sdkUrl
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Square SDK'))
      document.head.appendChild(script)
    })

    const Square = (window as unknown as { Square: { payments(appId: string, locId: string): Promise<{
      card(): Promise<typeof card & { attach(selector: string): Promise<void> }>
    }> } }).Square

    const payments = await Square.payments(applicationId, locationId)
    const cardInstance = await payments.card()
    await cardInstance.attach('#square-card-container')
    card = cardInstance
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to initialize Square payment'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  card?.destroy()
})

async function handleSubmit() {
  if (!card) return

  paying.value = true
  error.value = null

  try {
    const result = await card.tokenize()
    if (result.status !== 'OK' || !result.token) {
      error.value = result.errors?.[0]?.message || 'Card tokenization failed'
      return
    }

    // Send token to backend to create payment
    const res = await adminFetch('/api/admin/pos-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: props.items.map(i => ({
          categoryId: i.categoryId,
          itemName: i.itemName,
          quantity: i.quantity
        })),
        sourceId: result.token,
        customerName: props.customerName || undefined
      })
    })

    const data = await res.json() as { success: boolean; orderId?: string; paid?: boolean; error?: string }
    if (!data.success) {
      throw new Error(data.error || 'Payment failed')
    }

    emit('complete', data.orderId!)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Payment failed'
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-semibold text-center mb-4">Card Payment</h3>

      <div class="text-center mb-4">
        <p class="text-sm text-neutral-500">Order Total</p>
        <p class="text-2xl font-bold">${{ total.toFixed(2) }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-2"></div>
        <p class="text-sm text-neutral-500">Loading payment...</p>
      </div>

      <!-- Square Card Element -->
      <div id="square-card-container" class="mb-4"></div>

      <!-- Error -->
      <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
        {{ error }}
      </div>

      <!-- Actions -->
      <div v-if="!loading" class="flex gap-2">
        <button
          @click="emit('cancel')"
          class="flex-1 py-3 border border-neutral-300 rounded-lg font-medium text-sm hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          :disabled="paying"
          class="flex-1 py-3 bg-neutral-900 text-white rounded-lg font-medium text-sm hover:bg-neutral-800 disabled:opacity-50"
        >
          {{ paying ? 'Processing...' : `Pay $${total.toFixed(2)}` }}
        </button>
      </div>
    </div>
  </div>
</template>
