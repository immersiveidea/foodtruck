<script setup lang="ts">
import type { PosOrderItem } from '../../composables/usePosOrder'

defineProps<{
  items: PosOrderItem[]
  total: number
  readerConnected: boolean
  customerName: string
}>()

const emit = defineEmits<{
  increment: [categoryId: string, itemName: string]
  decrement: [categoryId: string, itemName: string]
  remove: [categoryId: string, itemName: string]
  clear: []
  pay: [method: 'cash' | 'card_external' | 'pos_terminal' | 'pos_card' | 'pos_qr']
  'update:customerName': [value: string]
}>()
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Order items -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="items.length === 0" class="flex items-center justify-center h-full text-neutral-400 text-sm">
        Tap items to add to order
      </div>
      <div v-else class="divide-y divide-neutral-100">
        <div
          v-for="item in items"
          :key="`${item.categoryId}:${item.itemName}`"
          class="flex items-center justify-between py-2 gap-2"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ item.itemName }}</p>
            <p class="text-xs text-neutral-500">${{ item.unitPrice.toFixed(2) }} each</p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              @click="emit('decrement', item.categoryId, item.itemName)"
              class="w-7 h-7 flex items-center justify-center rounded bg-neutral-100 hover:bg-neutral-200 text-sm font-medium"
            >
              -
            </button>
            <span class="w-6 text-center text-sm font-medium">{{ item.quantity }}</span>
            <button
              @click="emit('increment', item.categoryId, item.itemName)"
              class="w-7 h-7 flex items-center justify-center rounded bg-neutral-100 hover:bg-neutral-200 text-sm font-medium"
            >
              +
            </button>
          </div>
          <span class="text-sm font-medium w-16 text-right flex-shrink-0">
            ${{ (item.unitPrice * item.quantity).toFixed(2) }}
          </span>
          <button
            @click="emit('remove', item.categoryId, item.itemName)"
            class="text-neutral-300 hover:text-red-500 flex-shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Total & Actions -->
    <div class="border-t border-neutral-200 pt-3 mt-3 flex-shrink-0">
      <div class="flex justify-between items-center mb-3">
        <span class="font-semibold">Total</span>
        <span class="text-xl font-bold">${{ total.toFixed(2) }}</span>
      </div>

      <!-- Customer name -->
      <input
        v-if="items.length > 0"
        type="text"
        :value="customerName"
        @input="emit('update:customerName', ($event.target as HTMLInputElement).value)"
        placeholder="Customer name"
        class="w-full mb-3 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
      />

      <!-- Payment buttons -->
      <div class="grid grid-cols-2 gap-2 mb-2" v-if="items.length > 0">
        <button
          @click="emit('pay', 'cash')"
          class="py-3 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700"
        >
          Cash
        </button>
        <button
          @click="emit('pay', 'pos_terminal')"
          class="py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 relative"
        >
          <span class="flex items-center justify-center gap-1.5">
            Card
            <span
              :class="['inline-block w-2 h-2 rounded-full', readerConnected ? 'bg-green-300' : 'bg-red-300']"
            ></span>
          </span>
        </button>
        <button
          @click="emit('pay', 'pos_card')"
          class="py-3 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700"
        >
          Pay Online
        </button>
        <button
          @click="emit('pay', 'pos_qr')"
          class="py-3 bg-neutral-700 text-white rounded-lg font-medium text-sm hover:bg-neutral-800"
        >
          QR Code
        </button>
      </div>

      <div v-if="items.length > 0" class="flex justify-between items-center mb-2">
        <button
          @click="emit('pay', 'card_external')"
          class="text-xs text-neutral-400 hover:text-neutral-600 underline"
        >
          Manual Card
        </button>
      </div>

      <button
        v-if="items.length > 0"
        @click="emit('clear')"
        class="w-full py-2 border border-neutral-300 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50"
      >
        Clear Order
      </button>
    </div>
  </div>
</template>
