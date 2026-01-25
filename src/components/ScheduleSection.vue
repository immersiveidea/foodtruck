<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSchedule } from '../composables/useSchedule'
import type { ScheduleLocation } from '../types'

const { schedule } = useSchedule()
const selectedLocation = ref<ScheduleLocation | null>(null)

// Set initial selected location when schedule loads
watch(
  schedule,
  (newSchedule) => {
    if (newSchedule.length > 0 && !selectedLocation.value) {
      selectedLocation.value = newSchedule[0]!
    }
  },
  { immediate: true }
)

const mapSrc = computed(() => {
  if (!selectedLocation.value) return ''
  const { lat, lng } = selectedLocation.value
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`
})

// Format helpers for new date/time fields (with backward compatibility)
function getDayOfWeek(loc: ScheduleLocation): string {
  if (loc.day) return loc.day // Legacy format
  if (!loc.date) return ''
  const date = new Date(loc.date + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function getDisplayDate(loc: ScheduleLocation): string {
  if (!loc.startTime && loc.date) return loc.date // Legacy format (already formatted)
  if (!loc.date) return ''
  const date = new Date(loc.date + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getTimeDisplay(loc: ScheduleLocation): string {
  if (loc.time) return loc.time // Legacy format
  if (!loc.startTime || !loc.endTime) return ''

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours!, 10)
    const suffix = h >= 12 ? 'pm' : 'am'
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return minutes === '00' ? `${displayHour}${suffix}` : `${displayHour}:${minutes}${suffix}`
  }
  return `${formatTime(loc.startTime)} - ${formatTime(loc.endTime)}`
}
</script>

<template>
  <section id="schedule" class="bg-white px-4 py-12 md:py-20 md:px-8">
    <div class="max-w-4xl mx-auto">
      <h2 class="font-display text-3xl md:text-4xl font-semibold text-neutral-800 mb-8 text-center">Find Us</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Schedule List -->
        <div class="space-y-3">
          <button
            v-for="loc in schedule"
            :key="loc.id"
            @click="selectedLocation = loc"
            :class="[
              'w-full text-left p-4 rounded-lg border transition-all',
              selectedLocation?.id === loc.id
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg'
                : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-800'
            ]"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-display font-semibold">{{ getDayOfWeek(loc) }}, {{ getDisplayDate(loc) }}</p>
                <p :class="selectedLocation?.id === loc.id ? 'text-neutral-300' : 'text-neutral-500'" class="font-body text-sm">
                  {{ loc.location }}
                </p>
              </div>
              <span :class="selectedLocation?.id === loc.id ? 'text-neutral-300' : 'text-neutral-600'" class="font-body text-sm font-medium">
                {{ getTimeDisplay(loc) }}
              </span>
            </div>
          </button>
        </div>

        <!-- Map -->
        <div v-if="selectedLocation" class="bg-white rounded-lg overflow-hidden shadow-lg">
          <iframe
            :src="mapSrc"
            class="w-full h-64 md:h-full min-h-[300px]"
            frameborder="0"
            loading="lazy"
          ></iframe>
          <div class="p-4 border-t border-neutral-200">
            <h3 class="font-display font-semibold text-neutral-800">{{ selectedLocation.location }}</h3>
            <p class="font-body text-sm text-neutral-500">{{ selectedLocation.address }}</p>
            <p class="font-body text-sm text-neutral-600 font-medium mt-1">{{ getDayOfWeek(selectedLocation) }} · {{ getTimeDisplay(selectedLocation) }}</p>
            <p v-if="selectedLocation.duration" class="font-body text-xs text-neutral-400 mt-1">{{ selectedLocation.duration }}</p>
          </div>
        </div>
      </div>

      <p class="font-body text-center text-neutral-500 text-sm mt-8">
        Book us for your next event! We require 30 days advance notice for private catering.
      </p>
    </div>
  </section>
</template>
