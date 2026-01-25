<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import imageCompression from 'browser-image-compression'
import type { MenuData, ScheduleData, ScheduleLocation, BookingRequest, BookingsData, HeroContent, AboutContent, MenuItem } from '../types'

const adminKey = ref(localStorage.getItem('adminKey') || '')
const uploadingItemIndex = ref<number | null>(null)
const isAuthenticated = ref(false)
const activeTab = ref<'menu' | 'schedule' | 'bookings' | 'hero' | 'about'>('menu')
const loading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Menu state
const menuData = ref<MenuData>({ categories: [] })
const selectedCategoryId = ref<string | null>(null)

// Schedule state
const scheduleData = ref<ScheduleData>([])
const editingEvent = ref<ScheduleLocation | null>(null)

// Bookings state
const bookingsData = ref<BookingsData>([])
const expandedBookingId = ref<string | null>(null)

// Hero state
const heroData = ref<HeroContent>({ title: '', tagline: '', ctaText: '', ctaLink: '' })

// About state
const aboutData = ref<AboutContent>({ heading: '', paragraphs: [] })

// Preview state
const previewItem = ref<MenuItem | null>(null)
const previewImageUrl = ref<string | null>(null)
const previewPosition = ref<string>('center')
const previewScale = ref<number>(1)

const selectedCategory = computed(() =>
  menuData.value.categories.find(c => c.id === selectedCategoryId.value)
)

async function authenticate() {
  if (!adminKey.value) return

  loading.value = true
  try {
    const res = await fetch('/api/admin/menu', {
      headers: { 'X-Admin-Key': adminKey.value }
    })

    if (res.ok) {
      isAuthenticated.value = true
      localStorage.setItem('adminKey', adminKey.value)
      await loadData()
    } else {
      message.value = { type: 'error', text: 'Invalid admin key' }
      localStorage.removeItem('adminKey')
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to authenticate' }
  } finally {
    loading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [menuRes, scheduleRes, bookingsRes, heroRes, aboutRes] = await Promise.all([
      fetch('/api/admin/menu', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/schedule', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/bookings', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/hero', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/about', { headers: { 'X-Admin-Key': adminKey.value } })
    ])

    if (menuRes.ok) {
      const data = await menuRes.json()
      menuData.value = data.categories ? data : { categories: [] }
      if (menuData.value.categories.length > 0) {
        selectedCategoryId.value = menuData.value.categories[0]!.id
      }
    }

    if (scheduleRes.ok) {
      scheduleData.value = await scheduleRes.json()
    }

    if (bookingsRes.ok) {
      bookingsData.value = await bookingsRes.json()
    }

    if (heroRes.ok) {
      const data = await heroRes.json()
      if (data.title) {
        heroData.value = data
      }
    }

    if (aboutRes.ok) {
      const data = await aboutRes.json()
      if (data.heading) {
        aboutData.value = data
      }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to load data' }
  } finally {
    loading.value = false
  }
}

async function saveMenu() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(menuData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'Menu saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save menu' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save menu' }
  } finally {
    loading.value = false
  }
}

async function saveSchedule() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(scheduleData.value)
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

async function saveHero() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/hero', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(heroData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'Hero content saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save hero content' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save hero content' }
  } finally {
    loading.value = false
  }
}

async function saveAbout() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/about', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(aboutData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'About content saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save about content' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save about content' }
  } finally {
    loading.value = false
  }
}

function addParagraph() {
  aboutData.value.paragraphs.push('')
}

function removeParagraph(index: number) {
  aboutData.value.paragraphs.splice(index, 1)
}

function addCategory() {
  const id = `category-${Date.now()}`
  menuData.value.categories.push({
    id,
    name: 'New Category',
    items: []
  })
  selectedCategoryId.value = id
}

function removeCategory(id: string) {
  menuData.value.categories = menuData.value.categories.filter(c => c.id !== id)
  if (selectedCategoryId.value === id) {
    selectedCategoryId.value = menuData.value.categories[0]?.id ?? null
  }
}

function addMenuItem() {
  if (!selectedCategory.value) return
  selectedCategory.value.items.push({
    name: 'New Item',
    description: '',
    price: 0
  })
}

function removeMenuItem(index: number) {
  if (!selectedCategory.value) return
  const item = selectedCategory.value.items[index]
  if (item?.imageKey) {
    deleteImageFromR2(item.imageKey)
  }
  selectedCategory.value.items.splice(index, 1)
}

async function uploadImage(event: Event, item: MenuItem, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.value = { type: 'error', text: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    message.value = { type: 'error', text: 'File too large. Maximum size is 5MB.' }
    input.value = ''
    return
  }

  uploadingItemIndex.value = index
  message.value = null

  try {
    // Compress image before upload
    const compressionOptions = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/webp' as const,
      initialQuality: 0.8
    }
    const compressedFile = await imageCompression(file, compressionOptions)

    if (item.imageKey) {
      await deleteImageFromR2(item.imageKey)
    }

    const formData = new FormData()
    formData.append('file', compressedFile)

    const res = await fetch('/api/admin/images', {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey.value },
      body: formData
    })

    if (res.ok) {
      const data = await res.json() as { key: string }
      item.imageKey = data.key
      message.value = { type: 'success', text: 'Image uploaded. Click "Save Menu" to persist.' }
    } else {
      const error = await res.json() as { error: string }
      message.value = { type: 'error', text: error.error || 'Failed to upload image' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to upload image' }
  } finally {
    uploadingItemIndex.value = null
    input.value = ''
  }
}

async function deleteImageFromR2(key: string) {
  try {
    await fetch(`/api/admin/images?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminKey.value }
    })
  } catch {
    console.error('Failed to delete image from R2')
  }
}

async function removeImage(item: MenuItem) {
  if (!item.imageKey) return

  try {
    await deleteImageFromR2(item.imageKey)
    item.imageKey = undefined
    message.value = { type: 'success', text: 'Image removed. Click "Save Menu" to persist.' }
  } catch {
    message.value = { type: 'error', text: 'Failed to remove image' }
  }
}

function showPreview(item: MenuItem) {
  previewItem.value = item
  previewImageUrl.value = item.imageKey ? `/api/images/${item.imageKey}` : null
  previewPosition.value = item.imagePosition || 'center'
  previewScale.value = item.imageScale || 1
}

function closePreview() {
  previewItem.value = null
  previewImageUrl.value = null
}

function applyPosition() {
  if (previewItem.value) {
    previewItem.value.imagePosition = previewPosition.value
    previewItem.value.imageScale = previewScale.value
    message.value = { type: 'success', text: 'Image settings updated. Click "Save Menu" to persist.' }
  }
  closePreview()
}

function exportMenu() {
  const json = JSON.stringify(menuData.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'menu.json'
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
  fileInput.value?.click()
}

function importMenu(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.categories && Array.isArray(data.categories)) {
        menuData.value = data
        if (menuData.value.categories.length > 0) {
          selectedCategoryId.value = menuData.value.categories[0]!.id
        }
        message.value = { type: 'success', text: 'Menu imported successfully. Click "Save Menu" to persist changes.' }
      } else {
        message.value = { type: 'error', text: 'Invalid menu format. Expected { categories: [...] }' }
      }
    } catch {
      message.value = { type: 'error', text: 'Failed to parse JSON file' }
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function addScheduleEvent() {
  const newId = Math.max(0, ...scheduleData.value.map(e => e.id)) + 1
  editingEvent.value = {
    id: newId,
    day: 'Monday',
    date: '',
    location: '',
    address: '',
    time: '11am - 3pm',
    lat: 40.48,
    lng: -104.90
  }
}

function saveScheduleEvent() {
  if (!editingEvent.value) return

  const existingIndex = scheduleData.value.findIndex(e => e.id === editingEvent.value!.id)
  if (existingIndex >= 0) {
    scheduleData.value[existingIndex] = editingEvent.value
  } else {
    scheduleData.value.push(editingEvent.value)
  }
  editingEvent.value = null
}

function editScheduleEvent(event: ScheduleLocation) {
  editingEvent.value = { ...event }
}

function removeScheduleEvent(id: number) {
  scheduleData.value = scheduleData.value.filter(e => e.id !== id)
}

// Bookings functions
const sortedBookings = computed(() => {
  return [...bookingsData.value].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

function toggleBooking(id: string) {
  expandedBookingId.value = expandedBookingId.value === id ? null : id
}

async function updateBookingStatus(booking: BookingRequest, status: 'pending' | 'confirmed' | 'denied') {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify({
        id: booking.id,
        status,
        adminNotes: booking.adminNotes
      })
    })

    if (res.ok) {
      booking.status = status
      message.value = { type: 'success', text: 'Booking updated successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to update booking' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to update booking' }
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function logout() {
  isAuthenticated.value = false
  adminKey.value = ''
  localStorage.removeItem('adminKey')
}

onMounted(() => {
  if (adminKey.value) {
    authenticate()
  }
})
</script>

<template>
  <div class="min-h-screen bg-neutral-100">
    <!-- Header -->
    <header class="bg-neutral-900 text-white py-4 px-6">
      <div class="max-w-4xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-semibold">Admin Dashboard</h1>
        <div class="flex items-center gap-4">
          <router-link to="/" class="text-neutral-300 hover:text-white text-sm">
            View Site
          </router-link>
          <button
            v-if="isAuthenticated"
            @click="logout"
            class="text-neutral-300 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto py-8 px-4">
      <!-- Message -->
      <div
        v-if="message"
        :class="[
          'mb-6 p-4 rounded-lg',
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        ]"
      >
        {{ message.text }}
      </div>

      <!-- Login Form -->
      <div v-if="!isAuthenticated" class="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
        <h2 class="text-xl font-semibold mb-6">Admin Login</h2>
        <form @submit.prevent="authenticate">
          <label class="block mb-4">
            <span class="text-sm text-neutral-600">Admin Key</span>
            <input
              v-model="adminKey"
              type="password"
              class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
              placeholder="Enter admin key"
            />
          </label>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-2 px-4 rounded-lg hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Authenticating...' : 'Login' }}
          </button>
        </form>
      </div>

      <!-- Admin Panel -->
      <div v-else>
        <!-- Tabs -->
        <div class="flex gap-2 mb-6">
          <button
            @click="activeTab = 'menu'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'menu'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Menu
          </button>
          <button
            @click="activeTab = 'schedule'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'schedule'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Schedule
          </button>
          <button
            @click="activeTab = 'bookings'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'bookings'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Bookings
            <span
              v-if="bookingsData.filter(b => b.status === 'pending').length > 0"
              class="ml-1 px-2 py-0.5 text-xs rounded-full bg-yellow-500 text-white"
            >
              {{ bookingsData.filter(b => b.status === 'pending').length }}
            </span>
          </button>
          <button
            @click="activeTab = 'hero'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'hero'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Hero
          </button>
          <button
            @click="activeTab = 'about'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'about'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            About
          </button>
        </div>

        <!-- Menu Editor -->
        <div v-if="activeTab === 'menu'" class="space-y-6">
          <!-- Import/Export -->
          <div class="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <span class="text-sm text-neutral-600">Bulk update menu via JSON file</span>
            <div class="flex gap-2">
              <button
                @click="exportMenu"
                class="text-sm border border-neutral-300 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-50"
              >
                Export JSON
              </button>
              <button
                @click="triggerImport"
                class="text-sm border border-neutral-300 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-50"
              >
                Import JSON
              </button>
              <input
                ref="fileInput"
                type="file"
                accept=".json,application/json"
                class="hidden"
                @change="importMenu"
              />
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold">Categories</h2>
              <button
                @click="addCategory"
                class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
              >
                Add Category
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="category in menuData.categories"
                :key="category.id"
                @click="selectedCategoryId = category.id"
                :class="[
                  'px-3 py-1 rounded-full text-sm border',
                  selectedCategoryId === category.id
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                ]"
              >
                {{ category.name }}
              </button>
            </div>
          </div>

          <div v-if="selectedCategory" class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <input
                v-model="selectedCategory.name"
                class="text-lg font-semibold border-b border-transparent focus:border-neutral-300 focus:outline-none"
              />
              <div class="flex gap-2">
                <button
                  @click="addMenuItem"
                  class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
                >
                  Add Item
                </button>
                <button
                  @click="removeCategory(selectedCategory.id)"
                  class="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete Category
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <div
                v-for="(item, index) in selectedCategory.items"
                :key="index"
                class="border border-neutral-200 rounded-lg p-4"
              >
                <div class="flex justify-between items-start mb-2">
                  <input
                    v-model="item.name"
                    class="font-medium border-b border-transparent focus:border-neutral-300 focus:outline-none flex-1"
                    placeholder="Item name"
                  />
                  <div class="flex items-center gap-2 ml-4">
                    <span class="text-neutral-500">$</span>
                    <input
                      v-model.number="item.price"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-20 font-medium border border-neutral-200 rounded px-2 py-1 focus:border-neutral-400 focus:outline-none"
                      placeholder="0.00"
                    />
                    <button
                      @click="removeMenuItem(index)"
                      class="text-red-600 hover:text-red-700 text-sm ml-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <textarea
                  v-model="item.description"
                  rows="2"
                  class="w-full text-sm text-neutral-600 border border-neutral-200 rounded px-2 py-1 focus:border-neutral-400 focus:outline-none mb-3"
                  placeholder="Item description (optional)"
                ></textarea>

                <!-- Image Upload -->
                <div class="flex items-center gap-3">
                  <div
                    v-if="item.imageKey"
                    class="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200"
                  >
                    <img
                      :src="`/api/images/${item.imageKey}`"
                      :alt="item.name"
                      class="w-full h-full object-cover"
                    />
                    <button
                      @click="removeImage(item)"
                      class="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700"
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                  <label class="cursor-pointer">
                    <span
                      :class="[
                        'inline-block text-sm px-3 py-1 rounded border',
                        uploadingItemIndex === index
                          ? 'bg-neutral-100 text-neutral-400 border-neutral-200'
                          : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                      ]"
                    >
                      {{ uploadingItemIndex === index ? 'Uploading...' : (item.imageKey ? 'Change Image' : 'Add Image') }}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="hidden"
                      :disabled="uploadingItemIndex === index"
                      @change="uploadImage($event, item, index)"
                    />
                  </label>
                  <button
                    v-if="item.imageKey"
                    @click="showPreview(item)"
                    class="text-sm text-neutral-600 border border-neutral-300 px-3 py-1 rounded hover:bg-neutral-50"
                  >
                    Preview
                  </button>
                  <span class="text-xs text-neutral-400">JPEG, PNG, or WebP (max 5MB)</span>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="saveMenu"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Menu' }}
          </button>
        </div>

        <!-- Schedule Editor -->
        <div v-if="activeTab === 'schedule'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold">Schedule Events</h2>
              <button
                @click="addScheduleEvent"
                class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
              >
                Add Event
              </button>
            </div>

            <!-- Event Editor Modal -->
            <div v-if="editingEvent" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold mb-4">
                  {{ scheduleData.find(e => e.id === editingEvent?.id) ? 'Edit Event' : 'New Event' }}
                </h3>

                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <label class="block">
                      <span class="text-sm text-neutral-600">Day</span>
                      <select
                        v-model="editingEvent.day"
                        class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      >
                        <option>Monday</option>
                        <option>Tuesday</option>
                        <option>Wednesday</option>
                        <option>Thursday</option>
                        <option>Friday</option>
                        <option>Saturday</option>
                        <option>Sunday</option>
                      </select>
                    </label>
                    <label class="block">
                      <span class="text-sm text-neutral-600">Date</span>
                      <input
                        v-model="editingEvent.date"
                        class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                        placeholder="Jan 26"
                      />
                    </label>
                  </div>

                  <label class="block">
                    <span class="text-sm text-neutral-600">Location Name</span>
                    <input
                      v-model="editingEvent.location"
                      class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      placeholder="Auraria Campus"
                    />
                  </label>

                  <label class="block">
                    <span class="text-sm text-neutral-600">Address</span>
                    <input
                      v-model="editingEvent.address"
                      class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      placeholder="1201 5th St, Denver"
                    />
                  </label>

                  <label class="block">
                    <span class="text-sm text-neutral-600">Time</span>
                    <input
                      v-model="editingEvent.time"
                      class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      placeholder="11am - 3pm"
                    />
                  </label>

                  <div class="grid grid-cols-2 gap-4">
                    <label class="block">
                      <span class="text-sm text-neutral-600">Latitude</span>
                      <input
                        v-model.number="editingEvent.lat"
                        type="number"
                        step="0.000001"
                        class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      />
                    </label>
                    <label class="block">
                      <span class="text-sm text-neutral-600">Longitude</span>
                      <input
                        v-model.number="editingEvent.lng"
                        type="number"
                        step="0.000001"
                        class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      />
                    </label>
                  </div>
                </div>

                <div class="flex gap-3 mt-6">
                  <button
                    @click="editingEvent = null"
                    class="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    @click="saveScheduleEvent"
                    class="flex-1 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <!-- Events List -->
            <div class="space-y-3">
              <div
                v-for="event in scheduleData"
                :key="event.id"
                class="border border-neutral-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p class="font-medium">{{ event.day }}, {{ event.date }}</p>
                  <p class="text-sm text-neutral-500">{{ event.location }} - {{ event.time }}</p>
                  <p class="text-sm text-neutral-400">{{ event.address }}</p>
                </div>
                <div class="flex gap-2">
                  <button
                    @click="editScheduleEvent(event)"
                    class="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Edit
                  </button>
                  <button
                    @click="removeScheduleEvent(event.id)"
                    class="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p v-if="scheduleData.length === 0" class="text-neutral-500 text-center py-8">
                No events scheduled. Click "Add Event" to create one.
              </p>
            </div>
          </div>

          <button
            @click="saveSchedule"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Schedule' }}
          </button>
        </div>

        <!-- Bookings Manager -->
        <div v-if="activeTab === 'bookings'" class="space-y-4">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Booking Requests</h2>

            <div v-if="sortedBookings.length === 0" class="text-neutral-500 text-center py-8">
              No booking requests yet.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="booking in sortedBookings"
                :key="booking.id"
                class="border border-neutral-200 rounded-lg overflow-hidden"
              >
                <!-- Booking Header -->
                <div
                  @click="toggleBooking(booking.id)"
                  class="p-4 cursor-pointer hover:bg-neutral-50 flex justify-between items-center"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <span
                        :class="[
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        ]"
                      >
                        {{ booking.status }}
                      </span>
                      <span class="font-medium">{{ booking.name }}</span>
                    </div>
                    <p class="text-sm text-neutral-500 mt-1">
                      {{ booking.eventType }} - {{ booking.eventDate }} at {{ booking.location }}
                    </p>
                  </div>
                  <svg
                    :class="['w-5 h-5 text-neutral-400 transition-transform', expandedBookingId === booking.id ? 'rotate-180' : '']"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <!-- Booking Details (Expanded) -->
                <div v-if="expandedBookingId === booking.id" class="border-t border-neutral-200 p-4 bg-neutral-50">
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
                      <p class="font-medium">{{ booking.eventDate }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Event Time</p>
                      <p class="font-medium">{{ booking.eventTime }}</p>
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
                    <div class="col-span-2">
                      <p class="text-neutral-500">Submitted</p>
                      <p class="font-medium">{{ formatDate(booking.createdAt) }}</p>
                    </div>
                  </div>

                  <div v-if="booking.message" class="mb-4">
                    <p class="text-neutral-500 text-sm">Additional Details</p>
                    <p class="text-sm bg-white p-3 rounded border border-neutral-200 mt-1">{{ booking.message }}</p>
                  </div>

                  <div class="mb-4">
                    <label class="block">
                      <span class="text-sm text-neutral-500">Admin Notes</span>
                      <textarea
                        v-model="booking.adminNotes"
                        rows="2"
                        class="mt-1 block w-full text-sm border border-neutral-300 rounded px-3 py-2 focus:border-neutral-400 focus:outline-none"
                        placeholder="Internal notes about this booking..."
                      ></textarea>
                    </label>
                  </div>

                  <div class="flex gap-2">
                    <button
                      v-if="booking.status !== 'confirmed'"
                      @click="updateBookingStatus(booking, 'confirmed')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      v-if="booking.status !== 'denied'"
                      @click="updateBookingStatus(booking, 'denied')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Deny
                    </button>
                    <button
                      v-if="booking.status !== 'pending'"
                      @click="updateBookingStatus(booking, 'pending')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Reset to Pending
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Editor -->
        <div v-if="activeTab === 'hero'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Hero Section</h2>
            <p class="text-sm text-neutral-500 mb-6">Edit the hero banner content that appears at the top of the homepage.</p>

            <div class="space-y-4">
              <label class="block">
                <span class="text-sm text-neutral-600">Title</span>
                <input
                  v-model="heroData.title"
                  class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                  placeholder="YoYo Bubble Tea"
                />
                <span class="text-xs text-neutral-400 mt-1">Appears in the navigation bar and hero banner</span>
              </label>

              <label class="block">
                <span class="text-sm text-neutral-600">Tagline</span>
                <textarea
                  v-model="heroData.tagline"
                  rows="2"
                  class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                  placeholder="Everything's yummy at YoYo! Refreshing boba, bubble waffles & more."
                ></textarea>
              </label>

              <div class="grid grid-cols-2 gap-4">
                <label class="block">
                  <span class="text-sm text-neutral-600">Button Text</span>
                  <input
                    v-model="heroData.ctaText"
                    class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                    placeholder="Find Us Today"
                  />
                </label>
                <label class="block">
                  <span class="text-sm text-neutral-600">Button Link</span>
                  <input
                    v-model="heroData.ctaLink"
                    class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                    placeholder="#schedule"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            @click="saveHero"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Hero' }}
          </button>
        </div>

        <!-- About Editor -->
        <div v-if="activeTab === 'about'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">About Section</h2>
            <p class="text-sm text-neutral-500 mb-6">Edit the "Our Story" section content.</p>

            <div class="space-y-4">
              <label class="block">
                <span class="text-sm text-neutral-600">Heading</span>
                <input
                  v-model="aboutData.heading"
                  class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                  placeholder="Our Story"
                />
              </label>

              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-neutral-600">Paragraphs</span>
                  <button
                    @click="addParagraph"
                    class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
                  >
                    Add Paragraph
                  </button>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(_paragraph, index) in aboutData.paragraphs"
                    :key="index"
                    class="border border-neutral-200 rounded-lg p-3"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <span class="text-xs text-neutral-400">Paragraph {{ index + 1 }}</span>
                      <button
                        @click="removeParagraph(index)"
                        class="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      v-model="aboutData.paragraphs[index]"
                      rows="3"
                      class="w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none text-sm"
                      placeholder="Enter paragraph text..."
                    ></textarea>
                  </div>

                  <p v-if="aboutData.paragraphs.length === 0" class="text-neutral-500 text-center py-4 text-sm">
                    No paragraphs yet. Click "Add Paragraph" to create one.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="saveAbout"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save About' }}
          </button>
        </div>
      </div>
    </main>

    <!-- Image Preview Modal -->
    <div v-if="previewItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-neutral-50 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Menu Item Preview</h3>

        <!-- Exact replica of TabbedMenuSection card -->
        <div class="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
          <div
            v-if="previewImageUrl"
            class="h-40 bg-neutral-100"
            :style="{
              backgroundImage: `url(${previewImageUrl})`,
              backgroundPosition: previewPosition,
              backgroundSize: `${previewScale * 100}%`,
              backgroundRepeat: 'no-repeat'
            }"
          />
          <div class="p-5">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-display text-lg font-semibold text-neutral-900">{{ previewItem.name }}</h3>
              <span class="font-display text-lg font-semibold text-neutral-900">${{ previewItem.price.toFixed(2) }}</span>
            </div>
            <p v-if="previewItem.description" class="font-body text-sm text-neutral-500 leading-relaxed">
              {{ previewItem.description }}
            </p>
          </div>
        </div>

        <!-- Position Selector -->
        <div v-if="previewImageUrl" class="mt-4">
          <p class="text-sm text-neutral-600 mb-2">Image focal point:</p>
          <div class="grid grid-cols-3 gap-1 w-32 mx-auto">
            <button
              v-for="pos in ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right']"
              :key="pos"
              @click="previewPosition = pos"
              :class="[
                'w-10 h-10 rounded text-xs border',
                previewPosition === pos
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-100'
              ]"
              :title="pos"
            >
              {{ pos === 'top left' ? 'TL' : pos === 'top' ? 'T' : pos === 'top right' ? 'TR' : pos === 'left' ? 'L' : pos === 'center' ? 'C' : pos === 'right' ? 'R' : pos === 'bottom left' ? 'BL' : pos === 'bottom' ? 'B' : 'BR' }}
            </button>
          </div>

          <!-- Scale/Zoom Slider -->
          <div class="mt-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-neutral-600">Zoom:</span>
              <span class="text-sm text-neutral-500">{{ previewScale < 1 ? `-${Math.round((1 - previewScale) * 100)}%` : previewScale > 1 ? `+${Math.round((previewScale - 1) * 100)}%` : '0%' }}</span>
            </div>
            <input
              v-model.number="previewScale"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              class="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
            <div class="flex justify-between text-xs text-neutral-400 mt-1">
              <span>Zoom out</span>
              <span>1x</span>
              <span>Zoom in</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-4">
          <button
            @click="closePreview"
            class="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            @click="applyPosition"
            class="flex-1 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
