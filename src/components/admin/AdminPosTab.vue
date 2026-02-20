<script setup lang="ts">
import { ref } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'
import { usePosOrder } from '../../composables/usePosOrder'
import PosMenuGrid from './PosMenuGrid.vue'
import PosOrderPanel from './PosOrderPanel.vue'
import PosCashPayment from './PosCashPayment.vue'
import PosCardPayment from './PosCardPayment.vue'
import PosStripePayment from './PosStripePayment.vue'
import PosQrPayment from './PosQrPayment.vue'

const { adminFetch, message } = useAdminApi()
const { menuData } = useAdminData()
const { items, total, addItem, incrementItem, decrementItem, removeItem, clearOrder, getCheckoutItems } = usePosOrder()

type PaymentModal = 'cash' | 'card_external' | 'stripe_pos' | 'stripe_qr' | null
const activePaymentModal = ref<PaymentModal>(null)
const paymentLoading = ref(false)
const lastCompletedOrder = ref<{ id: string; method: string; change?: number } | null>(null)

function openPayment(method: 'cash' | 'card_external' | 'stripe_pos' | 'stripe_qr') {
  activePaymentModal.value = method
}

function closePayment() {
  activePaymentModal.value = null
}

async function completeCashPayment(cashTendered: number) {
  paymentLoading.value = true
  try {
    const res = await adminFetch('/api/admin/pos-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: getCheckoutItems(),
        paymentMethod: 'cash',
        cashTendered
      })
    })

    const data = await res.json() as { success: boolean; order?: { id: string; changeDue?: number }; error?: string }
    if (!data.success) {
      message.value = { type: 'error', text: data.error || 'Failed to create order' }
      return
    }

    lastCompletedOrder.value = { id: data.order!.id, method: 'Cash', change: data.order!.changeDue }
    clearOrder()
    closePayment()
  } catch {
    message.value = { type: 'error', text: 'Failed to create order' }
  } finally {
    paymentLoading.value = false
  }
}

async function completeCardPayment() {
  paymentLoading.value = true
  try {
    const res = await adminFetch('/api/admin/pos-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: getCheckoutItems(),
        paymentMethod: 'card_external'
      })
    })

    const data = await res.json() as { success: boolean; order?: { id: string }; error?: string }
    if (!data.success) {
      message.value = { type: 'error', text: data.error || 'Failed to create order' }
      return
    }

    lastCompletedOrder.value = { id: data.order!.id, method: 'External Card' }
    clearOrder()
    closePayment()
  } catch {
    message.value = { type: 'error', text: 'Failed to create order' }
  } finally {
    paymentLoading.value = false
  }
}

function completeStripePayment(orderId: string) {
  lastCompletedOrder.value = { id: orderId, method: 'Stripe' }
  clearOrder()
  closePayment()
}

function completeQrPayment(orderId: string) {
  lastCompletedOrder.value = { id: orderId, method: 'QR Code' }
  clearOrder()
  closePayment()
}

function dismissSuccess() {
  lastCompletedOrder.value = null
}
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)]">
    <!-- Menu Grid (left) -->
    <div class="lg:w-3/5 bg-white rounded-lg shadow p-4 overflow-hidden flex flex-col min-h-[300px]">
      <PosMenuGrid :menuData="menuData" @addItem="addItem" />
    </div>

    <!-- Order Panel (right) -->
    <div class="lg:w-2/5 bg-white rounded-lg shadow p-4 overflow-hidden flex flex-col min-h-[300px]">
      <PosOrderPanel
        :items="items"
        :total="total"
        @increment="incrementItem"
        @decrement="decrementItem"
        @remove="removeItem"
        @clear="clearOrder"
        @pay="openPayment"
      />
    </div>
  </div>

  <!-- Success banner -->
  <div
    v-if="lastCompletedOrder"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-40"
  >
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
    <span class="text-sm font-medium">
      Order complete ({{ lastCompletedOrder.method }})
      <template v-if="lastCompletedOrder.change !== undefined && lastCompletedOrder.change > 0">
        — Change: ${{ lastCompletedOrder.change.toFixed(2) }}
      </template>
    </span>
    <button @click="dismissSuccess" class="ml-2 text-green-200 hover:text-white">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Payment Modals -->
  <PosCashPayment
    v-if="activePaymentModal === 'cash'"
    :total="total"
    :loading="paymentLoading"
    @complete="completeCashPayment"
    @cancel="closePayment"
  />

  <PosCardPayment
    v-if="activePaymentModal === 'card_external'"
    :total="total"
    :loading="paymentLoading"
    @complete="completeCardPayment"
    @cancel="closePayment"
  />

  <PosStripePayment
    v-if="activePaymentModal === 'stripe_pos'"
    :total="total"
    :items="items"
    @complete="completeStripePayment"
    @cancel="closePayment"
  />

  <PosQrPayment
    v-if="activePaymentModal === 'stripe_qr'"
    :total="total"
    :items="items"
    @complete="completeQrPayment"
    @cancel="closePayment"
  />
</template>
