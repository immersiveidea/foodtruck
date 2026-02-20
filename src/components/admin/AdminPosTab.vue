<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'
import { usePosOrder } from '../../composables/usePosOrder'
import { usePosTerminal } from '../../composables/usePosTerminal'
import { usePaymentProvider } from '../../composables/usePaymentProvider'
import PosMenuGrid from './PosMenuGrid.vue'
import PosOrderPanel from './PosOrderPanel.vue'
import PosCashPayment from './PosCashPayment.vue'
import PosCardPayment from './PosCardPayment.vue'
import PosQrPayment from './PosQrPayment.vue'

const { adminFetch, message } = useAdminApi()
const { menuData } = useAdminData()
const { items, total, addItem, incrementItem, decrementItem, removeItem, updateItemNote, clearOrder, getCheckoutItems } = usePosOrder()
const { readerStatus, error: terminalError, initTerminal, discoverAndConnect } = usePosTerminal()
const { config: paymentConfig, ready: paymentReady } = usePaymentProvider()

const readerConnected = computed(() => readerStatus.value === 'connected')
const isStripe = computed(() => !paymentConfig.value || paymentConfig.value.provider === 'stripe')

// Dynamic components based on provider
const PosCardProviderComponent = computed(() => {
  if (paymentConfig.value?.provider === 'square') {
    return defineAsyncComponent(() => import('./PosCardPaymentSquare.vue'))
  }
  return defineAsyncComponent(() => import('./PosCardPaymentStripe.vue'))
})

const PosTerminalProviderComponent = computed(() => {
  if (paymentConfig.value?.provider === 'square') {
    return defineAsyncComponent(() => import('./PosTerminalPaymentSquare.vue'))
  }
  return defineAsyncComponent(() => import('./PosTerminalPaymentStripe.vue'))
})

onMounted(async () => {
  // Wait for payment config to determine if we need Stripe Terminal
  try {
    await paymentReady
  } catch {
    // Non-fatal: will default to stripe
  }

  if (isStripe.value) {
    await initTerminal()
    await discoverAndConnect()
  }
})

type PaymentModal = 'cash' | 'card_external' | 'pos_terminal' | 'pos_card' | 'pos_qr' | null
const customerName = ref('')
const activePaymentModal = ref<PaymentModal>(null)
const paymentLoading = ref(false)
const lastCompletedOrder = ref<{ id: string; method: string; change?: number } | null>(null)

function openPayment(method: 'cash' | 'card_external' | 'pos_terminal' | 'pos_card' | 'pos_qr') {
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
        cashTendered,
        customerName: customerName.value || undefined
      })
    })

    const data = await res.json() as { success: boolean; order?: { id: string; changeDue?: number }; error?: string }
    if (!data.success) {
      message.value = { type: 'error', text: data.error || 'Failed to create order' }
      return
    }

    lastCompletedOrder.value = { id: data.order!.id, method: 'Cash', change: data.order!.changeDue }
    clearOrder()
    customerName.value = ''
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
        paymentMethod: 'card_external',
        customerName: customerName.value || undefined
      })
    })

    const data = await res.json() as { success: boolean; order?: { id: string }; error?: string }
    if (!data.success) {
      message.value = { type: 'error', text: data.error || 'Failed to create order' }
      return
    }

    lastCompletedOrder.value = { id: data.order!.id, method: 'External Card' }
    clearOrder()
    customerName.value = ''
    closePayment()
  } catch {
    message.value = { type: 'error', text: 'Failed to create order' }
  } finally {
    paymentLoading.value = false
  }
}

function completePosCardPayment(orderId: string) {
  lastCompletedOrder.value = { id: orderId, method: 'Card' }
  clearOrder()
  customerName.value = ''
  closePayment()
}

function completeQrPayment(orderId: string) {
  lastCompletedOrder.value = { id: orderId, method: 'QR Code' }
  clearOrder()
  customerName.value = ''
  closePayment()
}

function completeTerminalPayment(orderId: string) {
  lastCompletedOrder.value = { id: orderId, method: 'Terminal' }
  clearOrder()
  customerName.value = ''
  closePayment()
}

function dismissSuccess() {
  lastCompletedOrder.value = null
}
</script>

<template>
  <!-- Reader Status (Stripe only) -->
  <div v-if="isStripe" class="flex items-center gap-2 mb-2 text-sm">
    <span
      :class="['inline-block w-2.5 h-2.5 rounded-full', readerConnected ? 'bg-green-500' : readerStatus === 'discovering' || readerStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500']"
    ></span>
    <span v-if="readerConnected" class="text-neutral-600">Reader: Connected</span>
    <span v-else-if="readerStatus === 'discovering'" class="text-neutral-500">Discovering readers...</span>
    <span v-else-if="readerStatus === 'connecting'" class="text-neutral-500">Connecting to reader...</span>
    <template v-else>
      <span class="text-neutral-500">Reader: Disconnected</span>
      <button @click="discoverAndConnect" class="text-blue-600 hover:text-blue-700 underline text-xs">Reconnect</button>
    </template>
    <span v-if="terminalError && !readerConnected" class="text-red-500 text-xs">{{ terminalError }}</span>
  </div>

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
        :readerConnected="readerConnected"
        v-model:customerName="customerName"
        @increment="incrementItem"
        @decrement="decrementItem"
        @remove="removeItem"
        @updateNote="updateItemNote"
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

  <component
    :is="PosCardProviderComponent"
    v-if="activePaymentModal === 'pos_card'"
    :total="total"
    :items="items"
    :customerName="customerName"
    @complete="completePosCardPayment"
    @cancel="closePayment"
  />

  <PosQrPayment
    v-if="activePaymentModal === 'pos_qr'"
    :total="total"
    :items="items"
    :customerName="customerName"
    @complete="completeQrPayment"
    @cancel="closePayment"
  />

  <component
    :is="PosTerminalProviderComponent"
    v-if="activePaymentModal === 'pos_terminal'"
    :total="total"
    :items="items"
    :customerName="customerName"
    @complete="completeTerminalPayment"
    @cancel="closePayment"
  />
</template>
