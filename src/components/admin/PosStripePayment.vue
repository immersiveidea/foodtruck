<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
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
const paying = ref(false)
const error = ref<string | null>(null)

let stripe: Stripe | null = null
let elements: StripeElements | null = null
let orderId = ''

onMounted(async () => {
  try {
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
    if (!stripePublishableKey) {
      throw new Error('Stripe publishable key not configured')
    }

    stripe = await loadStripe(stripePublishableKey)
    if (!stripe) {
      throw new Error('Failed to load Stripe')
    }

    // Create PaymentIntent via admin API
    const res = await adminFetch('/api/admin/pos-payment-intent', {
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

    const data = await res.json() as { success: boolean; clientSecret?: string; orderId?: string; error?: string }
    if (!data.success || !data.clientSecret) {
      throw new Error(data.error || 'Failed to create payment')
    }

    orderId = data.orderId!

    elements = stripe.elements({
      clientSecret: data.clientSecret,
      appearance: { theme: 'stripe' }
    })

    // Mount Payment Element
    const paymentElement = elements.create('payment')
    paymentElement.mount('#pos-payment-element')

    // Mount Express Checkout Element (Apple Pay / Google Pay)
    const expressCheckoutElement = elements.create('expressCheckout')
    expressCheckoutElement.mount('#pos-express-checkout')

    expressCheckoutElement.on('confirm', async () => {
      await handleSubmit()
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to initialize payment'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  // Stripe elements clean up automatically when unmounted
})

async function handleSubmit() {
  if (!stripe || !elements) return

  paying.value = true
  error.value = null

  try {
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/admin/pos'
      },
      redirect: 'if_required'
    })

    if (stripeError) {
      error.value = stripeError.message || 'Payment failed'
    } else {
      // Payment succeeded without redirect
      emit('complete', orderId)
    }
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
      <h3 class="text-lg font-semibold text-center mb-4">Card / Wallet Payment</h3>

      <div class="text-center mb-4">
        <p class="text-sm text-neutral-500">Order Total</p>
        <p class="text-2xl font-bold">${{ total.toFixed(2) }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-2"></div>
        <p class="text-sm text-neutral-500">Loading payment...</p>
      </div>

      <!-- Express Checkout (Apple Pay / Google Pay) -->
      <div id="pos-express-checkout" class="mb-3"></div>

      <!-- Payment Element -->
      <div id="pos-payment-element" class="mb-4"></div>

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
