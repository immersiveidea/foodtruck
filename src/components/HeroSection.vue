<script setup lang="ts">
</script>

<template>
  <header class="relative text-white">
    <!-- Background Image -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      style="background-image: url('/hero.jpg')"
    ></div>
    <!-- Dark Overlay -->
    <div class="absolute inset-0 bg-black/40"></div>

    <!-- Content -->
    <div class="relative">
      <nav class="flex items-center justify-between px-4 py-4 md:px-8">
        <span class="font-display text-xl font-bold tracking-tight">YoYo Bubble Tea</span>
        <div class="hidden md:flex gap-6 text-sm font-medium font-body">
          <a href="#about" class="hover:text-white/70 transition-colors">About</a>
          <a href="#menu" class="hover:text-white/70 transition-colors">Menu</a>
          <a href="#schedule" class="hover:text-white/70 transition-colors">Find Us</a>
        </div>
        <button class="md:hidden p-2" aria-label="Menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      <div class="px-4 py-20 md:py-32 md:px-8 text-center">
        <h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4 drop-shadow-lg">YoYo Bubble Tea</h1>
        <p class="font-body text-lg md:text-xl text-white/80 mb-8 max-w-md mx-auto drop-shadow">
          Everything's yummy at YoYo! Refreshing boba, bubble waffles & more.
        </p>
        <a
          href="#schedule"
          class="inline-block font-body bg-white text-neutral-900 font-semibold px-6 py-3 rounded-full hover:bg-neutral-100 transition-colors shadow-lg"
        >
          Find Us Today
        </a>
      </div>
    </div>
  </header>
</template>
