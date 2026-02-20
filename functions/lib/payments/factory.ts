import type { PaymentProvider } from './types'
import { StripePaymentProvider } from './stripe'
import { SquarePaymentProvider } from './square'

export function createPaymentProvider(env: Record<string, string>): PaymentProvider {
  if (env.PAYMENT_PROVIDER === 'square') {
    return new SquarePaymentProvider(env)
  }
  return new StripePaymentProvider(env)
}
