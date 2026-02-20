<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminApi } from '../composables/useAdminApi'
import { useAdminData } from '../composables/useAdminData'
import AdminPosTab from '../components/admin/AdminPosTab.vue'
import AdminMenuTab from '../components/admin/AdminMenuTab.vue'
import AdminScheduleTab from '../components/admin/AdminScheduleTab.vue'
import AdminBookingsTab from '../components/admin/AdminBookingsTab.vue'
import AdminOrdersTab from '../components/admin/AdminOrdersTab.vue'
import AdminHeroTab from '../components/admin/AdminHeroTab.vue'
import AdminAboutTab from '../components/admin/AdminAboutTab.vue'
import AdminSocialTab from '../components/admin/AdminSocialTab.vue'
import AdminFaviconTab from '../components/admin/AdminFaviconTab.vue'
import AdminBackupTab from '../components/admin/AdminBackupTab.vue'

const route = useRoute()
const router = useRouter()
const { adminKey, isAuthenticated, loading, message, adminFetch, logout } = useAdminApi()
const { bookingsData, ordersData, loadAllData } = useAdminData()

const validTabs = ['pos', 'menu', 'schedule', 'bookings', 'orders', 'hero', 'about', 'social', 'favicon', 'backup'] as const
type TabKey = typeof validTabs[number]

const activeTab = computed<TabKey>(() => {
  const tab = route.params.tab as string
  return validTabs.includes(tab as TabKey) ? (tab as TabKey) : 'menu'
})

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
  { key: 'pos', label: 'POS' },
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

const mobileMenuOpen = ref(false)

function selectTab(key: string) {
  router.push(`/admin/${key}`)
  mobileMenuOpen.value = false
}
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

    <main :class="['mx-auto py-8 px-4', activeTab === 'pos' ? 'max-w-full' : 'max-w-4xl']">
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
        <!-- Mobile Tab Dropdown -->
        <div class="md:hidden mb-6 relative">
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow text-neutral-900 font-medium"
          >
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {{ tabs.find(t => t.key === activeTab)?.label }}
            </span>
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': mobileMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="mobileMenuOpen" class="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg py-1">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="selectTab(tab.key)"
              :class="[
                'w-full text-left px-4 py-3 flex items-center justify-between',
                activeTab === tab.key
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-50'
              ]"
            >
              <span>{{ tab.label }}</span>
              <span class="flex gap-1">
                <span
                  v-if="tab.key === 'bookings' && bookingsData.filter(b => b.status === 'pending').length > 0"
                  class="px-2 py-0.5 text-xs rounded-full bg-yellow-500 text-white"
                >
                  {{ bookingsData.filter(b => b.status === 'pending').length }}
                </span>
                <span
                  v-if="tab.key === 'orders' && ordersData.filter(o => o.status === 'paid').length > 0"
                  class="px-2 py-0.5 text-xs rounded-full bg-green-500 text-white"
                >
                  {{ ordersData.filter(o => o.status === 'paid').length }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <!-- Desktop Tabs -->
        <div class="hidden md:flex gap-2 mb-6">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="selectTab(tab.key)"
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

        <AdminPosTab v-if="activeTab === 'pos'" />
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
