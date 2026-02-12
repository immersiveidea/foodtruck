<script setup lang="ts">
import { onMounted } from 'vue'
import type { FaviconContent } from './types'

onMounted(async () => {
  try {
    const res = await fetch('/api/favicon')
    if (res.ok) {
      const data = await res.json() as FaviconContent
      if (data.siteName) {
        document.title = data.siteName
      }
    }
  } catch {
    // Keep default title
  }
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <router-view />
  </div>
</template>
