<script setup lang="ts">
import { useCart } from '../composables/useCart'

const { itemCount, isOpen } = useCart()
</script>

<template>
  <button
    @click="isOpen = !isOpen"
    class="relative p-2 hover:text-white/70 transition-colors"
    aria-label="Shopping cart"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
    <span
      v-if="itemCount > 0"
      class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
    >
      {{ itemCount > 9 ? '9+' : itemCount }}
    </span>
  </button>
</template>
