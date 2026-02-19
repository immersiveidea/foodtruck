<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Order, OrderStatus } from '../../types'
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'
import AdminOrderCard from './AdminOrderCard.vue'

const { loading, message, adminFetch } = useAdminApi()
const { ordersData, settingsData } = useAdminData()

const expandedOrderId = ref<string | null>(null)
const ordersFilter = ref<'all' | OrderStatus>('all')

const filteredOrders = computed(() => {
  const sorted = [...ordersData.value].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  if (ordersFilter.value === 'all') return sorted
  return sorted.filter(o => o.status === ordersFilter.value)
})

function toggleOrder(id: string) {
  expandedOrderId.value = expandedOrderId.value === id ? null : id
}

async function toggleOnlineOrdering() {
  settingsData.value.onlineOrderingEnabled = !settingsData.value.onlineOrderingEnabled
  loading.value = true
  message.value = null
  try {
    const res = await adminFetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData.value),
    })
    if (res.ok) {
      message.value = { type: 'success', text: `Online ordering ${settingsData.value.onlineOrderingEnabled ? 'enabled' : 'disabled'}` }
    } else {
      settingsData.value.onlineOrderingEnabled = !settingsData.value.onlineOrderingEnabled
      message.value = { type: 'error', text: 'Failed to update settings' }
    }
  } catch {
    settingsData.value.onlineOrderingEnabled = !settingsData.value.onlineOrderingEnabled
    message.value = { type: 'error', text: 'Failed to update settings' }
  } finally {
    loading.value = false
  }
}

async function updateOrderStatus(order: Order, status: OrderStatus) {
  loading.value = true
  message.value = null
  try {
    const res = await adminFetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id, status, adminNotes: order.adminNotes }),
    })
    if (res.ok) {
      order.status = status
      order.updatedAt = new Date().toISOString()
      message.value = { type: 'success', text: `Order marked as ${status}` }
    } else {
      message.value = { type: 'error', text: 'Failed to update order' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to update order' }
  } finally {
    loading.value = false
  }
}

async function saveOrderNotes(order: Order) {
  loading.value = true
  message.value = null
  try {
    const res = await adminFetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id, adminNotes: order.adminNotes }),
    })
    if (res.ok) {
      message.value = { type: 'success', text: 'Notes saved' }
    } else {
      message.value = { type: 'error', text: 'Failed to save notes' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save notes' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white rounded-lg shadow p-6 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">Online Ordering</h2>
        <p class="text-sm text-neutral-500 mt-1">{{ settingsData.onlineOrderingEnabled ? 'Customers can place orders from the menu' : 'Ordering is hidden from customers' }}</p>
      </div>
      <button @click="toggleOnlineOrdering" :disabled="loading" :class="['relative inline-flex h-7 w-12 items-center rounded-full transition-colors', settingsData.onlineOrderingEnabled ? 'bg-green-500' : 'bg-neutral-300']">
        <span :class="['inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform', settingsData.onlineOrderingEnabled ? 'translate-x-6' : 'translate-x-1']" />
      </button>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Orders</h2>
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="filter in (['all', 'paid', 'fulfilled', 'cancelled', 'pending'] as const)"
          :key="filter"
          @click="ordersFilter = filter"
          :class="['px-3 py-1.5 text-sm font-medium rounded-full border transition-all', ordersFilter === filter ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50']"
        >
          {{ filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1) }}
        </button>
      </div>

      <div v-if="filteredOrders.length === 0" class="text-neutral-500 text-center py-8">No orders found.</div>
      <div v-else class="space-y-3">
        <AdminOrderCard
          v-for="order in filteredOrders"
          :key="order.id"
          :order="order"
          :expanded="expandedOrderId === order.id"
          :loading="loading"
          @toggle="toggleOrder"
          @update-status="updateOrderStatus"
          @save-notes="saveOrderNotes"
        />
      </div>
    </div>
  </div>
</template>
