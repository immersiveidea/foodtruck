import Stripe from 'stripe'

interface Env {
  CONTENT: KVNamespace
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
}

interface Order {
  id: string
  items: { categoryId: string; itemName: string; quantity: number; unitPrice: number }[]
  total: number
  customerName?: string
  customerEmail?: string
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  stripeSessionId: string
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
  adminNotes?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY)
  const signature = context.request.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await context.request.text()
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      context.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Webhook signature verification failed: ${msg}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (orderId) {
      const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null ?? []
      const index = orders.findIndex(o => o.id === orderId)

      if (index !== -1) {
        orders[index].status = 'paid'
        orders[index].updatedAt = new Date().toISOString()
        orders[index].stripePaymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id

        if (session.customer_details?.name) {
          orders[index].customerName = session.customer_details.name
        }
        if (session.customer_details?.email) {
          orders[index].customerEmail = session.customer_details.email
        }

        await context.env.CONTENT.put('orders', JSON.stringify(orders))
      }
    }
  }

  return new Response('ok', { status: 200 })
}
