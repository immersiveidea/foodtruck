<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { StripeEmbeddedCheckout } from '@stripe/stripe-js'
import { useCart } from '../composables/useCart'
import { usePaymentProvider } from '../composables/usePaymentProvider'

const router = useRouter()
const { items, fetchCheckoutSession, fetchClientSecret } = useCart()
const { ready } = usePaymentProvider()

const loading = ref(true)
const error = ref<string | null>(null)
let checkout: StripeEmbeddedCheckout | null = null

onMounted(async () => {
  if (items.value.length === 0) {
    router.replace('/')
    return
  }

  try {
    const config = await ready

    if (config?.provider === 'square') {
      // Square: get checkout URL and redirect
      const session = await fetchCheckoutSession()
      if (session.checkoutUrl) {
        window.location.href = session.checkoutUrl
        return
      }
      throw new Error('No checkout URL returned from payment provider')
    }

    // Stripe: embedded checkout
    const { loadStripe } = await import('@stripe/stripe-js')
    const stripePublishableKey = config?.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
    if (!stripePublishableKey) {
      throw new Error('Stripe publishable key not configured')
    }

    const stripe = await loadStripe(stripePublishableKey)
    if (!stripe) {
      throw new Error('Failed to load Stripe')
    }

    checkout = await stripe.initEmbeddedCheckout({
      fetchClientSecret
    })

    checkout.mount('#stripe-checkout')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to initialize checkout'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  checkout?.destroy()
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-8 md:py-12">
    <div class="max-w-lg mx-auto">
      <div class="mb-6 flex items-center gap-4">
        <router-link
          to="/"
          class="text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </router-link>
        <h1 class="font-display text-2xl font-semibold text-neutral-900">Checkout</h1>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-4"></div>
        <p class="font-body text-neutral-600">Loading checkout...</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="text-center py-16">
        <p class="font-body text-red-600 mb-4">{{ error }}</p>
        <router-link
          to="/"
          class="inline-block font-body bg-neutral-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors"
        >
          Return to Menu
        </router-link>
      </div>

      <!-- Stripe Embedded Checkout mounts here -->
      <div id="stripe-checkout"></div>
    </div>
  </div>
</template>
