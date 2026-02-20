<script setup lang="ts">
import type { Order, OrderStatus } from '../../types'
import { formatTimestamp } from '../../composables/useDateTimeFormat'

defineProps<{
  order: Order
  expanded: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  updateStatus: [order: Order, status: OrderStatus]
  saveNotes: [order: Order]
}>()
</script>

<template>
  <div class="border border-neutral-200 rounded-lg overflow-hidden">
    <div @click="emit('toggle', order.id)" class="p-4 cursor-pointer hover:bg-neutral-50 flex justify-between items-center">
      <div class="flex-1">
        <div class="flex items-center gap-3 flex-wrap">
          <span :class="['px-2 py-0.5 text-xs font-medium rounded-full', order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'paid' ? 'bg-green-100 text-green-800' : order.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800']">
            {{ order.status }}
          </span>
          <span v-if="order.source" :class="['px-2 py-0.5 text-xs font-medium rounded-full', order.source === 'pos' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800']">
            {{ order.source === 'pos' ? 'POS' : 'Online' }}
          </span>
          <span class="font-medium">{{ order.customerName || 'Guest' }}</span>
          <span class="text-sm text-neutral-500">${{ order.total.toFixed(2) }}</span>
        </div>
        <p class="text-sm text-neutral-500 mt-1">
          {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }} &middot; {{ formatTimestamp(order.createdAt) }}
        </p>
      </div>
      <svg :class="['w-5 h-5 text-neutral-400 transition-transform', expanded ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <div v-if="expanded" class="border-t border-neutral-200 p-4 bg-neutral-50">
      <div class="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p class="text-neutral-500">Customer</p>
          <p class="font-medium">{{ order.customerName || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Email</p>
          <p class="font-medium">{{ order.customerEmail || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Order ID</p>
          <p class="font-medium text-xs font-mono">{{ order.id }}</p>
        </div>
        <div>
          <p class="text-neutral-500">Placed</p>
          <p class="font-medium">{{ formatTimestamp(order.createdAt) }}</p>
        </div>
        <div v-if="order.paymentMethod">
          <p class="text-neutral-500">Payment</p>
          <p class="font-medium">{{ order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'card_external' ? 'External Card' : order.paymentMethod === 'pos_terminal' || order.paymentMethod === 'stripe_terminal' ? 'Terminal' : order.paymentMethod === 'pos_card' || order.paymentMethod === 'stripe_pos' ? 'Card' : order.paymentMethod === 'pos_qr' || order.paymentMethod === 'stripe_qr' ? 'QR Code' : 'Online' }}</p>
        </div>
        <div v-if="order.cashTendered">
          <p class="text-neutral-500">Cash Tendered</p>
          <p class="font-medium">${{ order.cashTendered.toFixed(2) }} (change: ${{ (order.changeDue ?? 0).toFixed(2) }})</p>
        </div>
      </div>

      <div class="mb-4">
        <p class="text-neutral-500 text-sm mb-2">Items</p>
        <div class="bg-white border border-neutral-200 rounded divide-y divide-neutral-100">
          <div v-for="item in order.items" :key="`${item.categoryId}:${item.itemName}`" class="px-3 py-2 text-sm">
            <div class="flex justify-between">
              <span>{{ item.itemName }} <span class="text-neutral-400">x{{ item.quantity }}</span></span>
              <span class="font-medium">${{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
            </div>
            <template v-if="item.notes?.some((n: string) => n.trim())">
              <p
                v-for="(note, idx) in item.notes"
                :key="idx"
                v-show="note.trim()"
                class="text-xs italic text-amber-600 mt-0.5 ml-2"
              >
                {{ item.quantity > 1 ? `(${idx + 1}) ` : '' }}{{ note }}
              </p>
            </template>
          </div>
          <div class="flex justify-between px-3 py-2 text-sm font-semibold">
            <span>Total</span>
            <span>${{ order.total.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label class="block">
          <span class="text-sm text-neutral-500">Admin Notes</span>
          <textarea v-model="order.adminNotes" rows="2" class="mt-1 block w-full text-sm border border-neutral-300 rounded px-3 py-2 focus:border-neutral-400 focus:outline-none" placeholder="Internal notes about this order..."></textarea>
        </label>
      </div>

      <div class="flex gap-2 mb-2">
        <button @click="emit('saveNotes', order)" :disabled="loading" class="flex-1 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50 text-sm font-medium">Save Notes</button>
      </div>

      <div class="flex gap-2">
        <button v-if="order.status === 'paid'" @click="emit('updateStatus', order, 'fulfilled')" :disabled="loading" class="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">Mark Fulfilled</button>
        <button v-if="order.status !== 'cancelled' && order.status !== 'pending'" @click="emit('updateStatus', order, 'cancelled')" :disabled="loading" class="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium">Cancel Order</button>
        <button v-if="order.status === 'fulfilled' || order.status === 'cancelled'" @click="emit('updateStatus', order, 'paid')" :disabled="loading" class="flex-1 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 disabled:opacity-50 text-sm font-medium">Revert to Paid</button>
      </div>
    </div>
  </div>
</template>
