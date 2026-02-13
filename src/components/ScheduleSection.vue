<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSchedule } from '../composables/useSchedule'
import { formatDayOfWeek, formatDisplayDate, formatTimeRange } from '../composables/useDateTimeFormat'
import type { ScheduleLocation } from '../types'

const { schedule } = useSchedule()
const selectedLocation = ref<ScheduleLocation | null>(null)

// Set initial selected location when schedule loads, and update when schedule data changes
watch(
  schedule,
  (newSchedule) => {
    if (newSchedule.length > 0) {
      // If we have a selection, find the matching item in the new schedule by id
      if (selectedLocation.value) {
        const updated = newSchedule.find(loc => loc.id === selectedLocation.value!.id)
        selectedLocation.value = updated || newSchedule[0]!
      } else {
        selectedLocation.value = newSchedule[0]!
      }
    }
  },
  { immediate: true }
)

const mapSrc = computed(() => {
  if (!selectedLocation.value || selectedLocation.value.private) return ''
  const { lat, lng } = selectedLocation.value
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`
})

// Format helpers with backward compatibility for legacy fields
function getDayOfWeek(loc: ScheduleLocation): string {
  // Prioritize computing from ISO date if startTime exists (new format)
  if (loc.startTime && loc.date) {
    return formatDayOfWeek(loc.date)
  }
  if (loc.day) return loc.day // Legacy fallback
  return formatDayOfWeek(loc.date || '')
}

function getDisplayDate(loc: ScheduleLocation): string {
  // Prioritize computing from ISO date if startTime exists (new format)
  if (loc.startTime && loc.date) {
    return formatDisplayDate(loc.date)
  }
  if (loc.date && !loc.date.includes('-')) return loc.date // Legacy format (already formatted)
  return formatDisplayDate(loc.date || '')
}

function getTimeDisplay(loc: ScheduleLocation): string {
  if (loc.time) return loc.time // Legacy format
  if (!loc.startTime || !loc.endTime) return ''
  return formatTimeRange(loc.startTime, loc.endTime)
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
                  {{ loc.private ? 'Private Event' : loc.location }}
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
            v-if="!selectedLocation.private"
            :src="mapSrc"
            class="w-full h-64 md:h-full min-h-[300px]"
            frameborder="0"
            loading="lazy"
          ></iframe>
          <div v-else class="w-full h-64 md:h-full min-h-[300px] bg-neutral-100 flex items-center justify-center">
            <p class="font-body text-neutral-400 text-lg">Private Event</p>
          </div>
          <div class="p-4 border-t border-neutral-200">
            <h3 class="font-display font-semibold text-neutral-800">{{ selectedLocation.private ? 'Private Event' : selectedLocation.location }}</h3>
            <p v-if="!selectedLocation.private" class="font-body text-sm text-neutral-500">{{ selectedLocation.address }}</p>
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
