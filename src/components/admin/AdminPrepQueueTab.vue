<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { PrepStatus } from '../../types'
import { usePrepQueue } from '../../composables/usePrepQueue'

const { prepOrders, polling, getUnitStatus, updateItemPrepStatus, startPolling, stopPolling } = usePrepQueue()

onMounted(() => startPolling())
onUnmounted(() => stopPolling())

interface PrepUnit {
  orderId: string
  orderNumber: string
  customerName: string
  source: string
  createdAt: string
  itemName: string
  itemIndex: number
  unitIndex: number
  unitLabel: string  // e.g. "Classic Milk Tea" or "Taro Slush (2 of 3)"
  status: PrepStatus
  note?: string
}

// Flatten orders into per-unit rows, active first (sorted by createdAt), done at bottom
const prepUnits = computed(() => {
  const active: PrepUnit[] = []
  const done: PrepUnit[] = []

  for (const order of prepOrders.value) {
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i]!
      for (let u = 0; u < item.quantity; u++) {
        const status = getUnitStatus(order, i, u)
        const noteText = item.notes?.[u]?.trim() || undefined
        const unit: PrepUnit = {
          orderId: order.id,
          orderNumber: order.id.slice(-6).toUpperCase(),
          customerName: order.customerName || 'Guest',
          source: order.source === 'pos' ? 'POS' : 'Online',
          createdAt: order.createdAt,
          itemName: item.itemName,
          itemIndex: i,
          unitIndex: u,
          unitLabel: item.quantity > 1
            ? `${item.itemName} (${u + 1} of ${item.quantity})`
            : item.itemName,
          status,
          note: noteText,
        }
        if (status === 'done') {
          done.push(unit)
        } else {
          active.push(unit)
        }
      }
    }
  }

  // Active are already in order-createdAt order from the API (FIFO)
  return [...active, ...done]
})

function timeAgo(createdAt: string) {
  const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function isOverdue(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) > 5 * 60 * 1000
}
</script>

<template>
  <div>
    <!-- Status bar -->
    <div class="flex items-center gap-2 mb-4 text-sm text-neutral-500">
      <span v-if="polling" class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      <span v-else class="h-3 w-3 rounded-full bg-neutral-300 inline-block"></span>
      <span>{{ polling ? 'Live — polling every 2s' : 'Paused' }}</span>
    </div>

    <!-- Prep list -->
    <div class="space-y-2 max-w-2xl mx-auto">
      <div
        v-for="unit in prepUnits"
        :key="`${unit.orderId}-${unit.itemIndex}-${unit.unitIndex}`"
        :class="[
          'bg-white border-2 rounded-lg p-4 flex items-center gap-4',
          unit.status === 'queued' ? 'border-orange-200' :
          unit.status === 'started' ? 'border-yellow-200' :
          'border-green-200 opacity-60'
        ]"
      >
        <!-- Order info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="text-lg font-mono font-bold text-neutral-900">#{{ unit.orderNumber }}</span>
            <span class="text-sm text-neutral-500">{{ unit.customerName }}</span>
            <span :class="['px-1.5 py-0.5 text-xs font-medium rounded-full', unit.source === 'POS' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800']">
              {{ unit.source }}
            </span>
            <span :class="['text-xs font-medium', isOverdue(unit.createdAt) ? 'text-red-600' : 'text-neutral-400']">
              {{ timeAgo(unit.createdAt) }}
            </span>
          </div>
          <p class="text-base font-medium text-neutral-800 truncate">{{ unit.unitLabel }}</p>
          <p v-if="unit.note" class="text-sm italic text-amber-600 truncate">{{ unit.note }}</p>
        </div>

        <!-- Action button -->
        <div class="shrink-0">
          <button
            v-if="unit.status === 'queued'"
            @click="updateItemPrepStatus(unit.orderId, unit.itemIndex, unit.unitIndex, 'started')"
            class="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold text-base hover:bg-orange-600 active:bg-orange-700"
          >
            START
          </button>
          <button
            v-else-if="unit.status === 'started'"
            @click="updateItemPrepStatus(unit.orderId, unit.itemIndex, unit.unitIndex, 'done')"
            class="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold text-base hover:bg-yellow-600 active:bg-yellow-700"
          >
            DONE
          </button>
          <div v-else class="flex items-center gap-1.5 px-4 py-3 text-green-600 font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <p v-if="prepUnits.length === 0" class="text-sm text-neutral-400 text-center py-12">No orders in the prep queue</p>
    </div>
  </div>
</template>
