<script setup lang="ts">
import { ref } from 'vue'
import type { ScheduleLocation } from '../../types'
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'
import { formatDayOfWeek, formatDisplayDate, formatTimeRange } from '../../composables/useDateTimeFormat'
import AdminScheduleEventForm from './AdminScheduleEventForm.vue'

const { loading, message, adminFetch } = useAdminApi()
const { scheduleData, menuData } = useAdminData()

const editingEvent = ref<ScheduleLocation | null>(null)
const isNewEvent = ref(false)

function addScheduleEvent() {
  const newId = Math.max(0, ...scheduleData.value.map(e => e.id)) + 1
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  isNewEvent.value = true
  editingEvent.value = {
    id: newId,
    date: defaultDate!,
    startTime: '11:00',
    endTime: '15:00',
    location: '',
    address: '',
    lat: 40.48,
    lng: -104.90,
    duration: '',
    private: false,
  }
}

function editScheduleEvent(event: ScheduleLocation) {
  isNewEvent.value = false
  editingEvent.value = event
}

function saveScheduleEvent(event: ScheduleLocation) {
  const existingIndex = scheduleData.value.findIndex(e => e.id === event.id)
  if (existingIndex >= 0) {
    scheduleData.value.splice(existingIndex, 1, event)
  } else {
    scheduleData.value.push(event)
  }
  editingEvent.value = null
}

function removeScheduleEvent(id: number) {
  scheduleData.value = scheduleData.value.filter(e => e.id !== id)
}

async function saveSchedule() {
  loading.value = true
  message.value = null
  try {
    const res = await adminFetch('/api/admin/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData.value),
    })
    if (res.ok) {
      message.value = { type: 'success', text: 'Schedule saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save schedule' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save schedule' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Schedule Events</h2>
        <button @click="addScheduleEvent" class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800">Add Event</button>
      </div>

      <AdminScheduleEventForm
        v-if="editingEvent"
        :event="editingEvent"
        :is-new="isNewEvent"
        :menu-categories="menuData.categories"
        @save="saveScheduleEvent"
        @cancel="editingEvent = null"
      />

      <div class="space-y-3">
        <div
          v-for="event in scheduleData"
          :key="event.id"
          class="border border-neutral-200 rounded-lg p-4 flex justify-between items-center"
        >
          <div>
            <p class="font-medium">
              {{ event.startTime ? formatDayOfWeek(event.date) : event.day }}, {{ event.startTime ? formatDisplayDate(event.date) : event.date }}
              <span v-if="event.private" class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Private</span>
            </p>
            <p class="text-sm text-neutral-500">
              {{ event.location }} - {{ event.startTime ? formatTimeRange(event.startTime, event.endTime) : event.time }}
            </p>
            <p class="text-sm text-neutral-400">{{ event.address }}</p>
            <p v-if="event.duration" class="text-sm text-neutral-400">Duration: {{ event.duration }}</p>
            <p v-if="event.priceOverrides && Object.keys(event.priceOverrides).length > 0" class="text-sm text-amber-600">
              {{ Object.keys(event.priceOverrides).length }} price override{{ Object.keys(event.priceOverrides).length !== 1 ? 's' : '' }}
            </p>
          </div>
          <div class="flex gap-2">
            <button @click="editScheduleEvent(event)" class="text-sm text-neutral-600 hover:text-neutral-900">Edit</button>
            <button @click="removeScheduleEvent(event.id)" class="text-sm text-red-600 hover:text-red-700">Remove</button>
          </div>
        </div>

        <p v-if="scheduleData.length === 0" class="text-neutral-500 text-center py-8">
          No events scheduled. Click "Add Event" to create one.
        </p>
      </div>
    </div>

    <button @click="saveSchedule" :disabled="loading" class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50">
      {{ loading ? 'Saving...' : 'Save Schedule' }}
    </button>
  </div>
</template>
