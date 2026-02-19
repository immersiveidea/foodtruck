<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BookingRequest } from '../../types'
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'
import AdminBookingCard from './AdminBookingCard.vue'

const { loading, message, adminFetch } = useAdminApi()
const { bookingsData, scheduleData } = useAdminData()

const expandedBookingId = ref<string | null>(null)

const sortedBookings = computed(() =>
  [...bookingsData.value].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
)

function toggleBooking(id: string) {
  expandedBookingId.value = expandedBookingId.value === id ? null : id
}

async function persistSchedule(): Promise<boolean> {
  const res = await adminFetch('/api/admin/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData.value),
  })
  return res.ok
}

async function syncScheduleFromBooking(booking: BookingRequest, status: 'pending' | 'confirmed' | 'denied') {
  const existingIndex = scheduleData.value.findIndex(e => e.bookingId === booking.id)

  if (status === 'confirmed') {
    if (existingIndex >= 0) {
      const existing = scheduleData.value[existingIndex]!
      existing.date = booking.eventDate
      existing.startTime = booking.startTime
      existing.endTime = booking.endTime
      existing.location = booking.location
      existing.address = booking.address
      existing.private = booking.private || false
    } else {
      const newId = Math.max(0, ...scheduleData.value.map(e => e.id)) + 1
      scheduleData.value.push({
        id: newId,
        date: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        location: booking.location,
        address: booking.address,
        lat: 40.48,
        lng: -104.90,
        private: booking.private || false,
        bookingId: booking.id,
      })
    }
  } else {
    if (existingIndex >= 0) {
      scheduleData.value.splice(existingIndex, 1)
    } else {
      return
    }
  }

  const ok = await persistSchedule()
  if (!ok) throw new Error('Failed to save schedule')
}

async function updateBookingStatus(booking: BookingRequest, status: 'pending' | 'confirmed' | 'denied') {
  loading.value = true
  message.value = null
  try {
    const res = await adminFetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: booking.id, status, adminNotes: booking.adminNotes, private: booking.private }),
    })

    if (res.ok) {
      booking.status = status
      try {
        await syncScheduleFromBooking(booking, status)
        message.value = { type: 'success', text: 'Booking updated and schedule synced' }
      } catch {
        message.value = { type: 'error', text: 'Booking updated but failed to sync schedule' }
      }
    } else {
      message.value = { type: 'error', text: 'Failed to update booking' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to update booking' }
  } finally {
    loading.value = false
  }
}

async function saveBooking(booking: BookingRequest) {
  await updateBookingStatus(booking, booking.status)
}
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Booking Requests</h2>
      <div v-if="sortedBookings.length === 0" class="text-neutral-500 text-center py-8">No booking requests yet.</div>
      <div v-else class="space-y-3">
        <AdminBookingCard
          v-for="booking in sortedBookings"
          :key="booking.id"
          :booking="booking"
          :expanded="expandedBookingId === booking.id"
          :loading="loading"
          @toggle="toggleBooking"
          @update-status="updateBookingStatus"
          @save="saveBooking"
        />
      </div>
    </div>
  </div>
</template>
