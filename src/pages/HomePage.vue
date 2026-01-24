<script setup lang="ts">
import HeroSection from '../components/HeroSection.vue'
import AboutSection from '../components/AboutSection.vue'
import TabbedMenuSection from '../components/TabbedMenuSection.vue'
import ScheduleSection from '../components/ScheduleSection.vue'
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
      <div class="mt-4 flex justify-center gap-6">
        <a href="#" class="hover:text-white transition-colors">Instagram</a>
        <a href="#" class="hover:text-white transition-colors">Facebook</a>
        <a href="#" class="hover:text-white transition-colors">TikTok</a>
      </div>
      <div class="mt-4">
        <router-link to="/book" class="text-white hover:text-neutral-300 transition-colors font-medium">
          Book Us for Your Event
        </router-link>
      </div>
    </footer>
  </div>
</template>
