<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-neutral-50 px-4 py-12 md:py-20">
    <div class="max-w-lg mx-auto text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-200 flex items-center justify-center">
        <svg class="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 class="font-display text-3xl font-semibold text-neutral-900 mb-2">Order Not Completed</h1>
      <p class="font-body text-neutral-600 mb-8">
        Your payment was cancelled. Don't worry — your cart items are still saved.
      </p>
      <router-link
        to="/"
        class="inline-block font-body bg-neutral-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors"
      >
        Return to Menu
      </router-link>
    </div>
  </div>
</template>
