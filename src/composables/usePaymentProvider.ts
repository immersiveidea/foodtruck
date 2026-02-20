import { ref } from 'vue'

export interface PaymentConfig {
  provider: 'stripe' | 'square'
  publishableKey?: string
  applicationId?: string
  locationId?: string
  environment?: string
}

const config = ref<PaymentConfig | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
let fetchPromise: Promise<PaymentConfig> | null = null

async function fetchConfig(): Promise<PaymentConfig> {
  const res = await fetch('/api/payment-config')
  if (!res.ok) {
    throw new Error('Failed to fetch payment config')
  }
  const data = await res.json() as Record<string, string>
  return {
    provider: (data.provider as 'stripe' | 'square') || 'stripe',
    publishableKey: data.publishableKey,
    applicationId: data.applicationId,
    locationId: data.locationId,
    environment: data.environment,
  }
}

export function usePaymentProvider() {
  if (!config.value && !fetchPromise) {
    loading.value = true
    fetchPromise = fetchConfig()
      .then(c => {
        config.value = c
        return c
      })
      .catch(e => {
        error.value = e instanceof Error ? e.message : 'Failed to load payment config'
        throw e
      })
      .finally(() => {
        loading.value = false
      })
  }

  return {
    config,
    loading,
    error,
    ready: fetchPromise || Promise.resolve(config.value!),
  }
}
