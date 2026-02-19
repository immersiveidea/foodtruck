<script setup lang="ts">
import { ref } from 'vue'
import type { ScheduleLocation, MenuData } from '../../types'
import type { AddressSuggestion } from '../../composables/useAddressSearch'
import { formatDayOfWeek } from '../../composables/useDateTimeFormat'
import AddressAutocomplete from '../AddressAutocomplete.vue'
import TimeRangePicker from '../TimeRangePicker.vue'
import MapPicker from '../MapPicker.vue'
import AdminEventPricingSection from './AdminEventPricingSection.vue'

const props = defineProps<{
  event: ScheduleLocation
  isNew: boolean
  menuCategories: MenuData['categories']
}>()

const emit = defineEmits<{
  save: [event: ScheduleLocation]
  cancel: []
}>()

const editingEvent = ref<ScheduleLocation>(JSON.parse(JSON.stringify(props.event)))
const showEventPricing = ref(!!(props.event.priceOverrides && Object.keys(props.event.priceOverrides).length > 0))

function onAddressSelect(suggestion: AddressSuggestion) {
  editingEvent.value.lat = parseFloat(suggestion.lat)
  editingEvent.value.lng = parseFloat(suggestion.lon)
}

function onPricingUpdate(updated: ScheduleLocation) {
  editingEvent.value = { ...editingEvent.value, priceOverrides: updated.priceOverrides }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-semibold mb-4">{{ isNew ? 'New Event' : 'Edit Event' }}</h3>

      <div class="space-y-4">
        <label class="block">
          <span class="text-sm text-neutral-600">Date</span>
          <input v-model="editingEvent.date" type="date" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2" />
          <span v-if="editingEvent.date" class="text-xs text-neutral-400 mt-1">{{ formatDayOfWeek(editingEvent.date) }}</span>
        </label>

        <label class="flex items-center gap-2">
          <input v-model="editingEvent.private" type="checkbox" class="rounded border-neutral-300" />
          <span class="text-sm text-neutral-600">Private Event</span>
          <span class="text-xs text-neutral-400">(hides location on public site)</span>
        </label>

        <TimeRangePicker v-model:start-time="editingEvent.startTime" v-model:end-time="editingEvent.endTime" />

        <label class="block">
          <span class="text-sm text-neutral-600">Duration (optional)</span>
          <input v-model="editingEvent.duration" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2" placeholder="e.g., 4 hours" />
          <span class="text-xs text-neutral-400 mt-1">Descriptive duration for display</span>
        </label>

        <label class="block">
          <span class="text-sm text-neutral-600">Location Name</span>
          <input v-model="editingEvent.location" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2" placeholder="Auraria Campus" />
        </label>

        <div class="block">
          <span class="text-sm text-neutral-600">Address</span>
          <div class="mt-1">
            <AddressAutocomplete v-model="editingEvent.address" placeholder="Start typing an address..." @select="onAddressSelect" />
          </div>
          <span class="text-xs text-neutral-400 mt-1">Latitude and longitude will auto-fill when you select an address</span>
        </div>

        <div class="block">
          <span class="text-sm text-neutral-600">Adjust Location</span>
          <div class="mt-1">
            <MapPicker v-model:lat="editingEvent.lat" v-model:lng="editingEvent.lng" />
          </div>
          <span class="text-xs text-neutral-400 mt-1">Click or drag the marker to set exact position</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm text-neutral-600">Latitude</span>
            <input v-model.number="editingEvent.lat" type="number" step="0.000001" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2" />
          </label>
          <label class="block">
            <span class="text-sm text-neutral-600">Longitude</span>
            <input v-model.number="editingEvent.lng" type="number" step="0.000001" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2" />
          </label>
        </div>

        <AdminEventPricingSection
          :event="editingEvent"
          :menu-categories="menuCategories"
          v-model:show-pricing="showEventPricing"
          @update:event="onPricingUpdate"
        />
      </div>

      <div class="flex gap-3 mt-6">
        <button @click="emit('cancel')" class="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">Cancel</button>
        <button @click="emit('save', editingEvent)" class="flex-1 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800">Save</button>
      </div>
    </div>
  </div>
</template>
