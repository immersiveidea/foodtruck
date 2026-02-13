<script setup lang="ts">
import { computed } from 'vue'
import { useHero } from '../composables/useHero'
import { useSocialLinks } from '../composables/useSocialLinks'
import SocialIcon from './SocialIcon.vue'

const { hero } = useHero()
const { socialLinks } = useSocialLinks()

const headerLinks = computed(() =>
  socialLinks.value.links.filter(l => l.showInHeader)
)

const backgroundStyle = computed(() => {
  const imageUrl = hero.value.imageKey
    ? `/api/images/${hero.value.imageKey}`
    : '/hero.jpg'
  const position = hero.value.imagePosition || 'center'
  const scale = hero.value.imageScale || 1

  return {
    backgroundImage: `url('${imageUrl}')`,
    backgroundPosition: position,
    backgroundSize: scale === 1 ? 'cover' : `${scale * 100}%`
  }
})
</script>

<template>
  <header class="relative text-white">
    <!-- Background Image -->
    <div
      class="absolute inset-0 bg-cover bg-no-repeat"
      :style="backgroundStyle"
    ></div>
    <!-- Dark Overlay -->
    <div class="absolute inset-0 bg-black/40"></div>

    <!-- Content -->
    <div class="relative">
      <nav class="flex items-center justify-between px-4 py-4 md:px-8">
        <span class="font-display text-xl font-bold tracking-tight">{{ hero.title }}</span>
        <div class="hidden md:flex items-center gap-6 text-sm font-medium font-body">
          <router-link :to="{ path: '/', hash: '#about' }" class="hover:text-white/70 transition-colors">About</router-link>
          <router-link :to="{ path: '/', hash: '#menu' }" class="hover:text-white/70 transition-colors">Menu</router-link>
          <router-link :to="{ path: '/', hash: '#schedule' }" class="hover:text-white/70 transition-colors">Find Us</router-link>
          <router-link to="/book" class="hover:text-white/70 transition-colors">Book Us</router-link>
          <template v-if="headerLinks.length > 0">
            <span class="text-white/30">|</span>
            <a
              v-for="link in headerLinks"
              :key="link.platform"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-white/70 transition-colors"
            >
              <SocialIcon :platform="link.platform" :size="16" />
            </a>
          </template>
        </div>
        <button class="md:hidden p-2" aria-label="Menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      <div class="px-4 py-20 md:py-32 md:px-8 text-center">
        <h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4 drop-shadow-lg">{{ hero.title }}</h1>
        <p class="font-body text-lg md:text-xl text-white/80 mb-8 max-w-md mx-auto drop-shadow">
          {{ hero.tagline }}
        </p>
        <a
          :href="hero.ctaLink"
          class="inline-block font-body bg-white text-neutral-900 font-semibold px-6 py-3 rounded-full hover:bg-neutral-100 transition-colors shadow-lg"
        >
          {{ hero.ctaText }}
        </a>
      </div>
    </div>
  </header>
</template>
