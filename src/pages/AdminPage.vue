<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { MenuData, ScheduleData, ScheduleLocation } from '../types'

const adminKey = ref(localStorage.getItem('adminKey') || '')
const isAuthenticated = ref(false)
const activeTab = ref<'menu' | 'schedule'>('menu')
const loading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Menu state
const menuData = ref<MenuData>({ categories: [] })
const selectedCategoryId = ref<string | null>(null)

// Schedule state
const scheduleData = ref<ScheduleData>([])
const editingEvent = ref<ScheduleLocation | null>(null)

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
    const [menuRes, scheduleRes] = await Promise.all([
      fetch('/api/admin/menu', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/schedule', { headers: { 'X-Admin-Key': adminKey.value } })
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
  selectedCategory.value.items.splice(index, 1)
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
                  class="w-full text-sm text-neutral-600 border border-neutral-200 rounded px-2 py-1 focus:border-neutral-400 focus:outline-none"
                  placeholder="Item description (optional)"
                ></textarea>
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
      </div>
    </main>
  </div>
</template>
