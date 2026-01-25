<script setup lang="ts">
import { ref, reactive } from 'vue'
import AddressAutocomplete from '../components/AddressAutocomplete.vue'
import type { AddressSuggestion } from '../composables/useAddressSearch'

const form = reactive({
  name: '',
  email: '',
  phone: '',
  eventDate: '',
  eventTime: '',
  location: '',
  address: '',
  lat: null as number | null,
  lng: null as number | null,
  eventType: '',
  guestCount: null as number | null,
  message: ''
})

function onAddressSelect(suggestion: AddressSuggestion) {
  form.lat = parseFloat(suggestion.lat)
  form.lng = parseFloat(suggestion.lon)
}

const loading = ref(false)
const submitted = ref(false)
const error = ref<string | null>(null)

async function submitForm() {
  error.value = null
  loading.value = true

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        guestCount: form.guestCount ?? 0
      })
    })

    const data = await res.json()

    if (res.ok && data.success) {
      submitted.value = true
    } else {
      error.value = data.error || 'Failed to submit booking request'
    }
  } catch {
    error.value = 'Failed to submit booking request. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-100">
    <!-- Header -->
    <header class="bg-neutral-900 text-white py-4 px-6">
      <div class="max-w-2xl mx-auto flex justify-between items-center">
        <router-link to="/" class="font-display text-xl font-bold tracking-tight">
          YoYo Bubble Tea
        </router-link>
        <router-link to="/" class="text-neutral-300 hover:text-white text-sm">
          Back to Home
        </router-link>
      </div>
    </header>

    <main class="max-w-2xl mx-auto py-8 px-4">
      <!-- Success State -->
      <div v-if="submitted" class="bg-white rounded-lg shadow p-8 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="font-display text-2xl font-bold mb-2">Booking Request Submitted!</h1>
        <p class="text-neutral-600 mb-6">
          Thank you for your interest in booking YoYo Bubble Tea for your event!
          We'll review your request and get back to you soon.
        </p>
        <router-link
          to="/"
          class="inline-block bg-neutral-900 text-white px-6 py-2 rounded-lg hover:bg-neutral-800"
        >
          Return Home
        </router-link>
      </div>

      <!-- Booking Form -->
      <div v-else class="bg-white rounded-lg shadow p-6 md:p-8">
        <h1 class="font-display text-2xl font-bold mb-2">Book Us for Your Event</h1>
        <p class="text-neutral-600 mb-6">
          Want YoYo Bubble Tea at your next event? Fill out the form below and we'll get back to you!
        </p>

        <!-- Error Message -->
        <div v-if="error" class="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="submitForm" class="space-y-6">
          <!-- Contact Info -->
          <div class="space-y-4">
            <h2 class="font-semibold text-neutral-900">Contact Information</h2>

            <label class="block">
              <span class="text-sm text-neutral-600">Name <span class="text-red-500">*</span></span>
              <input
                v-model="form.name"
                type="text"
                required
                class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                placeholder="Your full name"
              />
            </label>

            <label class="block">
              <span class="text-sm text-neutral-600">Email <span class="text-red-500">*</span></span>
              <input
                v-model="form.email"
                type="email"
                required
                class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </label>

            <label class="block">
              <span class="text-sm text-neutral-600">Phone <span class="text-red-500">*</span></span>
              <input
                v-model="form.phone"
                type="tel"
                required
                class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                placeholder="(555) 123-4567"
              />
            </label>
          </div>

          <!-- Event Details -->
          <div class="space-y-4">
            <h2 class="font-semibold text-neutral-900">Event Details</h2>

            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-sm text-neutral-600">Event Date <span class="text-red-500">*</span></span>
                <input
                  v-model="form.eventDate"
                  type="date"
                  required
                  class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                />
              </label>

              <label class="block">
                <span class="text-sm text-neutral-600">Event Time <span class="text-red-500">*</span></span>
                <input
                  v-model="form.eventTime"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                  placeholder="2pm - 6pm"
                />
              </label>
            </div>

            <label class="block">
              <span class="text-sm text-neutral-600">Location Name <span class="text-red-500">*</span></span>
              <input
                v-model="form.location"
                type="text"
                required
                class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                placeholder="e.g. Community Center, Office Park"
              />
            </label>

            <label class="block">
              <span class="text-sm text-neutral-600">Address <span class="text-red-500">*</span></span>
              <div class="mt-1">
                <AddressAutocomplete
                  v-model="form.address"
                  placeholder="Start typing an address..."
                  :required="true"
                  @select="onAddressSelect"
                />
              </div>
            </label>

            <label class="block">
              <span class="text-sm text-neutral-600">Event Type <span class="text-red-500">*</span></span>
              <input
                v-model="form.eventType"
                type="text"
                required
                class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                placeholder="e.g. Birthday Party, Corporate Event, Wedding"
              />
            </label>

            <label class="block">
              <span class="text-sm text-neutral-600">Expected Guests <span class="text-red-500">*</span></span>
              <input
                v-model.number="form.guestCount"
                type="number"
                min="1"
                required
                class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                placeholder="50"
              />
            </label>

            <label class="block">
              <span class="text-sm text-neutral-600">Additional Details</span>
              <textarea
                v-model="form.message"
                rows="4"
                class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
                placeholder="Any additional information about your event..."
              ></textarea>
            </label>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Submitting...' : 'Submit Booking Request' }}
          </button>
        </form>
      </div>
    </main>
  </div>
</template>
