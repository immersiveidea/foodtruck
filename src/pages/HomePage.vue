<script setup lang="ts">
import HeroSection from '../components/HeroSection.vue'
import AboutSection from '../components/AboutSection.vue'
import TabbedMenuSection from '../components/TabbedMenuSection.vue'
import ScheduleSection from '../components/ScheduleSection.vue'
import SocialIcon from '../components/SocialIcon.vue'
import { useSocialLinks } from '../composables/useSocialLinks'

const { socialLinks } = useSocialLinks()
</script>

<template>
  <div>
    <HeroSection />
    <AboutSection />
    <TabbedMenuSection />
    <ScheduleSection />

    <footer class="bg-neutral-900 text-neutral-300 py-8 px-4 text-center font-body">
      <p class="text-sm">&copy; 2026 YoYo Bubble Tea. All rights reserved.</p>
      <p class="text-sm mt-2"></p>
      <div v-if="socialLinks.links.some(l => l.showInFooter)" class="mt-4 flex justify-center gap-6">
        <a
          v-for="link in socialLinks.links.filter(l => l.showInFooter)"
          :key="link.platform"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-white transition-colors"
        >
          <SocialIcon :platform="link.platform" />
        </a>
      </div>
      <div class="mt-4">
        <router-link to="/book" class="text-white hover:text-neutral-300 transition-colors font-medium">
          Book Us for Your Event
        </router-link>
      </div>
    </footer>
  </div>
</template>
