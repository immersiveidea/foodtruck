import { computed, onUnmounted, ref } from 'vue'
import type { Order, PrepStatus } from '../types'
import { useAdminApi } from './useAdminApi'
import { useAdminData } from './useAdminData'

const prepOrders = ref<Order[]>([])
const polling = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

export function usePrepQueue() {
  const { adminFetch } = useAdminApi()
  const { ordersData } = useAdminData()

  function getUnitStatus(order: Order, itemIndex: number, unitIndex: number): PrepStatus {
    return order.items[itemIndex]?.prepStatuses?.[unitIndex] ?? 'queued'
  }

  // Count of non-done units across all prep orders
  const activePrepCount = computed(() => {
    let count = 0
    for (const order of prepOrders.value) {
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i]!
        for (let u = 0; u < item.quantity; u++) {
          if (getUnitStatus(order, i, u) !== 'done') count++
        }
      }
    }
    return count
  })

  async function fetchPrepQueue() {
    try {
      const res = await adminFetch('/api/admin/prep-queue')
      if (res.ok) {
        const data = await res.json() as { orders: Order[]; timestamp: string }
        prepOrders.value = data.orders
      }
    } catch {
      // silently fail — next poll will retry
    }
  }

  async function updateItemPrepStatus(orderId: string, itemIndex: number, unitIndex: number, status: PrepStatus) {
    // Optimistic local update
    const order = prepOrders.value.find(o => o.id === orderId)
    if (order) {
      const item = order.items[itemIndex]
      if (item) {
        if (!item.prepStatuses) {
          item.prepStatuses = new Array(item.quantity).fill('queued')
        }
        item.prepStatuses[unitIndex] = status
      }
      order.updatedAt = new Date().toISOString()
    }

    // Also update shared ordersData for badge consistency
    const sharedOrder = ordersData.value.find(o => o.id === orderId)
    if (sharedOrder) {
      const item = sharedOrder.items[itemIndex]
      if (item) {
        if (!item.prepStatuses) {
          item.prepStatuses = new Array(item.quantity).fill('queued')
        }
        item.prepStatuses[unitIndex] = status
      }
    }

    try {
      await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, itemPrepStatus: { itemIndex, unitIndex, status } }),
      })
    } catch {
      // Revert on failure — next poll will sync
      await fetchPrepQueue()
    }
  }

  function startPolling() {
    if (polling.value) return
    polling.value = true
    fetchPrepQueue()
    pollTimer = setInterval(fetchPrepQueue, 5000)
  }

  function stopPolling() {
    polling.value = false
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onUnmounted(() => {
    stopPolling()
  })

  return {
    prepOrders,
    activePrepCount,
    getUnitStatus,
    polling,
    fetchPrepQueue,
    updateItemPrepStatus,
    startPolling,
    stopPolling,
  }
}
