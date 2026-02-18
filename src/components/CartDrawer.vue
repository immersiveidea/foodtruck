<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart'

const router = useRouter()
const { items, isOpen, subtotal, updateQuantity, removeItem, clearCart } = useCart()

function handleCheckout() {
  isOpen.value = false
  router.push('/checkout')
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/40 z-40"
      @click="isOpen = false"
    ></div>
  </Transition>

  <!-- Drawer -->
  <Transition name="slide">
    <div
      v-if="isOpen"
      class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <h2 class="font-display text-lg font-semibold text-neutral-900">Your Cart</h2>
        <button @click="isOpen = false" class="p-2 text-neutral-400 hover:text-neutral-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Items -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div v-if="items.length === 0" class="text-neutral-500 text-center py-12 font-body">
          Your cart is empty
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="item in items"
            :key="`${item.categoryId}:${item.itemName}`"
            class="flex items-start gap-4 pb-4 border-b border-neutral-100 last:border-0"
          >
            <div class="flex-1 min-w-0">
              <p class="font-display font-medium text-neutral-900 truncate">{{ item.itemName }}</p>
              <p class="font-body text-sm text-neutral-500">${{ item.unitPrice.toFixed(2) }} each</p>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="updateQuantity(item.categoryId, item.itemName, item.quantity - 1)"
                class="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
              >
                -
              </button>
              <span class="font-body text-sm w-6 text-center">{{ item.quantity }}</span>
              <button
                @click="updateQuantity(item.categoryId, item.itemName, item.quantity + 1)"
                class="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
              >
                +
              </button>
              <button
                @click="removeItem(item.categoryId, item.itemName)"
                class="ml-2 text-neutral-400 hover:text-red-500"
                aria-label="Remove item"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="items.length > 0" class="border-t border-neutral-200 px-6 py-4 space-y-4">
        <div class="flex justify-between items-center">
          <span class="font-body text-neutral-600">Subtotal</span>
          <span class="font-display text-lg font-semibold text-neutral-900">${{ subtotal.toFixed(2) }}</span>
        </div>

        <button
          @click="handleCheckout"
          class="w-full py-3 bg-neutral-900 text-white font-body font-semibold rounded-full hover:bg-neutral-800 transition-colors"
        >
          Checkout
        </button>

        <button
          @click="clearCart"
          class="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700 font-body"
        >
          Clear Cart
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
