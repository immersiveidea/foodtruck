<script setup lang="ts">
import type { BookingRequest } from '../../types'
import { formatDayOfWeek, formatDisplayDate, formatTimeRange, formatTimestamp } from '../../composables/useDateTimeFormat'

defineProps<{
  booking: BookingRequest
  expanded: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  updateStatus: [booking: BookingRequest, status: 'pending' | 'confirmed' | 'denied']
  save: [booking: BookingRequest]
}>()
</script>

<template>
  <div class="border border-neutral-200 rounded-lg overflow-hidden">
    <div @click="emit('toggle', booking.id)" class="p-4 cursor-pointer hover:bg-neutral-50 flex justify-between items-center">
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <span :class="['px-2 py-0.5 text-xs font-medium rounded-full', booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
            {{ booking.status }}
          </span>
          <span class="font-medium">{{ booking.name }}</span>
        </div>
        <p class="text-sm text-neutral-500 mt-1">
          {{ booking.eventType }} - {{ booking.eventDate }} at {{ booking.location }}
        </p>
      </div>
      <svg :class="['w-5 h-5 text-neutral-400 transition-transform', expanded ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <div v-if="expanded" class="border-t border-neutral-200 p-4 bg-neutral-50">
      <div class="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p class="text-neutral-500">Email</p>
          <p class="font-medium">{{ booking.email }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Phone</p>
          <p class="font-medium">{{ booking.phone }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Event Date</p>
          <p class="font-medium">{{ formatDayOfWeek(booking.eventDate) }}, {{ formatDisplayDate(booking.eventDate) }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Event Time</p>
          <p class="font-medium">{{ booking.startTime ? formatTimeRange(booking.startTime, booking.endTime) : booking.eventTime }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Location</p>
          <p class="font-medium">{{ booking.location }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Address</p>
          <p class="font-medium">{{ booking.address }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Event Type</p>
          <p class="font-medium">{{ booking.eventType }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Guest Count</p>
          <p class="font-medium">{{ booking.guestCount }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Private Event</p>
          <label class="flex items-center gap-2 mt-1">
            <input v-model="booking.private" type="checkbox" class="rounded border-neutral-300" />
            <span class="text-sm font-medium">{{ booking.private ? 'Yes' : 'No' }}</span>
          </label>
        </div>
        <div class="col-span-2">
          <p class="text-neutral-500">Submitted</p>
          <p class="font-medium">{{ formatTimestamp(booking.createdAt) }}</p>
        </div>
      </div>

      <div v-if="booking.message" class="mb-4">
        <p class="text-neutral-500 text-sm">Additional Details</p>
        <p class="text-sm bg-white p-3 rounded border border-neutral-200 mt-1">{{ booking.message }}</p>
      </div>

      <div class="mb-4">
        <label class="block">
          <span class="text-sm text-neutral-500">Admin Notes</span>
          <textarea v-model="booking.adminNotes" rows="2" class="mt-1 block w-full text-sm border border-neutral-300 rounded px-3 py-2 focus:border-neutral-400 focus:outline-none" placeholder="Internal notes about this booking..."></textarea>
        </label>
      </div>

      <div class="flex gap-2 mb-2">
        <button @click="emit('save', booking)" :disabled="loading" class="flex-1 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50 text-sm font-medium">Save</button>
      </div>

      <div class="flex gap-2">
        <button v-if="booking.status !== 'confirmed'" @click="emit('updateStatus', booking, 'confirmed')" :disabled="loading" class="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium">Confirm</button>
        <button v-if="booking.status !== 'denied'" @click="emit('updateStatus', booking, 'denied')" :disabled="loading" class="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium">Deny</button>
        <button v-if="booking.status !== 'pending'" @click="emit('updateStatus', booking, 'pending')" :disabled="loading" class="flex-1 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 disabled:opacity-50 text-sm font-medium">Reset to Pending</button>
      </div>
    </div>
  </div>
</template>
