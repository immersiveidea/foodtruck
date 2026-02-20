import { createPaymentProvider } from '../../lib/payments/factory'

interface Env {
  CONTENT: KVNamespace
  [key: string]: unknown
}

interface Order {
  id: string
  items: { categoryId: string; itemName: string; quantity: number; unitPrice: number }[]
  total: number
  customerName?: string
  customerEmail?: string
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  providerSessionId?: string
  providerPaymentId?: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
  adminNotes?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const provider = createPaymentProvider(context.env as unknown as Record<string, string>)

  const result = await provider.validateWebhook(context.request)

  if (!result.valid) {
    return new Response('Webhook validation failed', { status: 400 })
  }

  for (const event of result.events) {
    if (event.type === 'payment_completed') {
      const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null ?? []
      const index = orders.findIndex(o => o.id === event.orderId)

      if (index !== -1 && orders[index].status === 'pending') {
        orders[index].status = 'paid'
        orders[index].updatedAt = new Date().toISOString()
        orders[index].providerPaymentId = event.providerPaymentId
        // Backward compat
        orders[index].stripePaymentIntentId = event.providerPaymentId

        if (event.customerName) {
          orders[index].customerName = event.customerName
        }
        if (event.customerEmail) {
          orders[index].customerEmail = event.customerEmail
        }

        await context.env.CONTENT.put('orders', JSON.stringify(orders))
      }
    }
  }

  return new Response('ok', { status: 200 })
}
