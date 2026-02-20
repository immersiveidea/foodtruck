import { ref } from 'vue'
import { loadStripeTerminal } from '@stripe/terminal-js'
import type { Terminal, Reader, ISdkManagedPaymentIntent, ErrorResponse } from '@stripe/terminal-js'
import { useAdminApi } from './useAdminApi'

export type ReaderStatus = 'disconnected' | 'discovering' | 'connecting' | 'connected'
export type TerminalPaymentStatus = 'idle' | 'waiting_for_card' | 'processing' | 'succeeded' | 'error'

const readerStatus = ref<ReaderStatus>('disconnected')
const connectedReader = ref<Reader | null>(null)
const paymentStatus = ref<TerminalPaymentStatus>('idle')
const error = ref<string | null>(null)
const simulated = import.meta.env.VITE_STRIPE_TERMINAL_SIMULATED === 'true'

let terminal: Terminal | null = null
let collectCancelable = false

function isErrorResponse(result: unknown): result is ErrorResponse {
  return result !== null && typeof result === 'object' && 'error' in (result as Record<string, unknown>)
}

export function usePosTerminal() {
  const { adminFetch } = useAdminApi()

  async function fetchConnectionToken(): Promise<string> {
    const res = await adminFetch('/api/admin/terminal-connection-token', {
      method: 'POST'
    })
    const data = await res.json() as { secret?: string; error?: string }
    if (!data.secret) {
      throw new Error(data.error || 'Failed to fetch connection token')
    }
    return data.secret
  }

  async function initTerminal() {
    if (terminal) return

    const stripeTerminal = await loadStripeTerminal()
    if (!stripeTerminal) {
      error.value = 'Failed to load Stripe Terminal SDK'
      return
    }

    terminal = stripeTerminal.create({
      onFetchConnectionToken: fetchConnectionToken,
      onUnexpectedReaderDisconnect() {
        readerStatus.value = 'disconnected'
        connectedReader.value = null
        error.value = 'Reader disconnected unexpectedly'
      }
    })
  }

  async function discoverAndConnect() {
    if (!terminal) {
      error.value = 'Terminal not initialized'
      return
    }

    error.value = null
    readerStatus.value = 'discovering'

    const discoverResult = await terminal.discoverReaders({ simulated })

    if (isErrorResponse(discoverResult)) {
      error.value = discoverResult.error.message
      readerStatus.value = 'disconnected'
      return
    }

    if (discoverResult.discoveredReaders.length === 0) {
      error.value = 'No readers found'
      readerStatus.value = 'disconnected'
      return
    }

    readerStatus.value = 'connecting'
    const connectResult = await terminal.connectReader(discoverResult.discoveredReaders[0]!)

    if (isErrorResponse(connectResult)) {
      error.value = connectResult.error.message
      readerStatus.value = 'disconnected'
      return
    }

    connectedReader.value = connectResult.reader
    readerStatus.value = 'connected'
    error.value = null
  }

  async function disconnect() {
    if (!terminal) return
    await terminal.disconnectReader()
    connectedReader.value = null
    readerStatus.value = 'disconnected'
  }

  async function collectPayment(clientSecret: string): Promise<{ success: boolean; error?: string }> {
    if (!terminal) {
      return { success: false, error: 'Terminal not initialized' }
    }

    error.value = null
    paymentStatus.value = 'waiting_for_card'
    collectCancelable = true

    const collectResult = await terminal.collectPaymentMethod(clientSecret)
    collectCancelable = false

    if (isErrorResponse(collectResult)) {
      if (collectResult.error.code === 'canceled') {
        paymentStatus.value = 'idle'
        return { success: false, error: 'canceled' }
      }
      paymentStatus.value = 'error'
      error.value = collectResult.error.message
      return { success: false, error: collectResult.error.message }
    }

    paymentStatus.value = 'processing'
    const processResult = await terminal.processPayment(collectResult.paymentIntent as ISdkManagedPaymentIntent)

    if (isErrorResponse(processResult)) {
      paymentStatus.value = 'error'
      error.value = processResult.error.message
      return { success: false, error: processResult.error.message }
    }

    paymentStatus.value = 'succeeded'
    return { success: true }
  }

  function cancelCollect() {
    if (!terminal || !collectCancelable) return
    collectCancelable = false
    paymentStatus.value = 'idle'
    terminal.cancelCollectPaymentMethod()
  }

  return {
    readerStatus,
    connectedReader,
    paymentStatus,
    error,
    simulated,
    initTerminal,
    discoverAndConnect,
    disconnect,
    collectPayment,
    cancelCollect
  }
}
