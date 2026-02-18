<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCart } from '../composables/useCart'

interface OrderItem {
  categoryId: string
  itemName: string
  quantity: number
  unitPrice: number
}

interface OrderData {
  id: string
  items: OrderItem[]
  total: number
  customerName?: string
  customerEmail?: string
  status: string
  createdAt: string
}

const route = useRoute()
const { clearCart } = useCart()

const order = ref<OrderData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchOrder(sessionId: string, attempt = 1): Promise<void> {
  try {
    const res = await fetch(`/api/orders?session_id=${encodeURIComponent(sessionId)}`)
    if (res.ok) {
      const data = await res.json() as OrderData
      if (data.status === 'pending' && attempt < 4) {
        // Webhook may not have fired yet — retry
        await new Promise(resolve => setTimeout(resolve, 2000))
        return fetchOrder(sessionId, attempt + 1)
      }
      order.value = data
      clearCart()
    } else {
      error.value = 'Could not find your order. Please check your email for confirmation.'
    }
  } catch {
    error.value = 'Failed to load order details.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const sessionId = route.query.session_id as string
  if (sessionId) {
    fetchOrder(sessionId)
  } else {
    error.value = 'No order session found.'
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-12 md:py-20">
    <div class="max-w-lg mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-4"></div>
        <p class="font-body text-neutral-600">Confirming your payment...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 class="font-display text-2xl font-semibold text-neutral-900 mb-2">Order Status</h1>
        <p class="font-body text-neutral-600 mb-6">{{ error }}</p>
        <router-link
          to="/"
          class="inline-block font-body bg-neutral-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors"
        >
          Return to Menu
        </router-link>
      </div>

      <!-- Success -->
      <div v-else-if="order" class="text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="font-display text-3xl font-semibold text-neutral-900 mb-2">Order Confirmed!</h1>
        <p class="font-body text-neutral-600 mb-8">
          Thank you{{ order.customerName ? `, ${order.customerName}` : '' }}! Your order has been placed.
        </p>

        <!-- Order Summary -->
        <div class="bg-white rounded-lg shadow-sm border border-neutral-100 p-6 text-left mb-8">
          <h2 class="font-display text-lg font-semibold text-neutral-900 mb-4">Order Summary</h2>

          <div class="space-y-3 mb-4">
            <div
              v-for="item in order.items"
              :key="`${item.categoryId}:${item.itemName}`"
              class="flex justify-between font-body text-sm"
            >
              <span class="text-neutral-700">
                {{ item.itemName }}
                <span class="text-neutral-400">x{{ item.quantity }}</span>
              </span>
              <span class="text-neutral-900 font-medium">${{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
            </div>
          </div>

          <div class="border-t border-neutral-100 pt-3 flex justify-between">
            <span class="font-body font-semibold text-neutral-900">Total</span>
            <span class="font-display text-lg font-semibold text-neutral-900">${{ order.total.toFixed(2) }}</span>
          </div>
        </div>

        <router-link
          to="/"
          class="inline-block font-body bg-neutral-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors"
        >
          Back to Menu
        </router-link>
      </div>
    </div>
  </div>
</template>
