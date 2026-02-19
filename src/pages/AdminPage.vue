<script setup lang="ts">
import { onMounted } from 'vue'
import { useAdminApi } from '../composables/useAdminApi'
import { useAdminData } from '../composables/useAdminData'
import AdminMenuTab from '../components/admin/AdminMenuTab.vue'
import AdminScheduleTab from '../components/admin/AdminScheduleTab.vue'
import AdminBookingsTab from '../components/admin/AdminBookingsTab.vue'
import AdminOrdersTab from '../components/admin/AdminOrdersTab.vue'
import AdminHeroTab from '../components/admin/AdminHeroTab.vue'
import AdminAboutTab from '../components/admin/AdminAboutTab.vue'
import AdminSocialTab from '../components/admin/AdminSocialTab.vue'
import AdminFaviconTab from '../components/admin/AdminFaviconTab.vue'
import AdminBackupTab from '../components/admin/AdminBackupTab.vue'
import { ref } from 'vue'

const { adminKey, isAuthenticated, loading, message, adminFetch, logout } = useAdminApi()
const { bookingsData, ordersData, loadAllData } = useAdminData()

const activeTab = ref<'menu' | 'schedule' | 'bookings' | 'orders' | 'hero' | 'about' | 'social' | 'favicon' | 'backup'>('menu')

async function authenticate() {
  if (!adminKey.value) return
  loading.value = true
  try {
    const res = await adminFetch('/api/admin/menu')
    if (res.ok) {
      isAuthenticated.value = true
      localStorage.setItem('adminKey', adminKey.value)
      await loadAllData()
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

onMounted(() => {
  if (adminKey.value) authenticate()
})

const tabs = [
  { key: 'menu', label: 'Menu' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'orders', label: 'Orders' },
  { key: 'hero', label: 'Hero' },
  { key: 'about', label: 'About' },
  { key: 'social', label: 'Social' },
  { key: 'favicon', label: 'Favicon' },
  { key: 'backup', label: 'Backup' },
] as const
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
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === tab.key
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            {{ tab.label }}
            <span
              v-if="tab.key === 'bookings' && bookingsData.filter(b => b.status === 'pending').length > 0"
              class="ml-1 px-2 py-0.5 text-xs rounded-full bg-yellow-500 text-white"
            >
              {{ bookingsData.filter(b => b.status === 'pending').length }}
            </span>
            <span
              v-if="tab.key === 'orders' && ordersData.filter(o => o.status === 'paid').length > 0"
              class="ml-1 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white"
            >
              {{ ordersData.filter(o => o.status === 'paid').length }}
            </span>
          </button>
        </div>

        <AdminMenuTab v-if="activeTab === 'menu'" />
        <AdminScheduleTab v-if="activeTab === 'schedule'" />
        <AdminBookingsTab v-if="activeTab === 'bookings'" />
        <AdminOrdersTab v-if="activeTab === 'orders'" />
        <AdminHeroTab v-if="activeTab === 'hero'" />
        <AdminAboutTab v-if="activeTab === 'about'" />
        <AdminSocialTab v-if="activeTab === 'social'" />
        <AdminFaviconTab v-if="activeTab === 'favicon'" />
        <AdminBackupTab v-if="activeTab === 'backup'" />
      </div>
    </main>
  </div>
</template>
