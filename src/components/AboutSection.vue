<script setup lang="ts">
import { useAbout } from '../composables/useAbout'

const { about } = useAbout()
</script>

<template>
  <section id="about" class="px-4 py-12 md:py-20 md:px-8 max-w-3xl mx-auto">
    <h2 class="font-display text-3xl md:text-4xl font-semibold text-neutral-900 mb-6 text-center">{{ about.heading }}</h2>
    <div class="font-body space-y-4 text-neutral-600 leading-relaxed">
      <p v-for="(paragraph, index) in about.paragraphs" :key="index">
        {{ paragraph }}
      </p>
    </div>
  </section>
</template>
