import { createPaymentProvider } from '../lib/payments/factory'
import { validateAndBuildLineItems, generateOrderId } from '../lib/payments/helpers'

interface Env {
  CONTENT: KVNamespace
  [key: string]: unknown
}

interface CheckoutRequestItem {
  categoryId: string
  itemName: string
  quantity: number
}

interface OrderLineItem {
  categoryId: string
  itemName: string
  quantity: number
  unitPrice: number
}

interface Order {
  id: string
  items: OrderLineItem[]
  total: number
  customerName?: string
  customerEmail?: string
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  providerSessionId?: string
  providerPaymentId?: string
  paymentProvider?: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  source?: string
  paymentMethod?: string
  createdAt: string
  updatedAt: string
  adminNotes?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { items: CheckoutRequestItem[] }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ success: false, error: 'Cart is empty' }, { status: 400 })
    }

    // Check if online ordering is enabled
    const settings = await context.env.CONTENT.get('settings', 'json') as { onlineOrderingEnabled?: boolean } | null
    if (!settings?.onlineOrderingEnabled) {
      return Response.json({ success: false, error: 'Online ordering is currently disabled' }, { status: 403 })
    }

    // Validate cart items against authoritative menu prices
    const { lineItems, providerLineItems, totalCents } = await validateAndBuildLineItems(
      context.env.CONTENT,
      body.items.map(i => ({
        categoryId: i.categoryId,
        itemName: i.itemName,
        quantity: i.quantity,
      }))
    )

    const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const orderId = generateOrderId()
    const now = new Date().toISOString()
    const origin = new URL(context.request.url).origin

    const provider = createPaymentProvider(context.env as unknown as Record<string, string>)
    const result = await provider.createOnlineCheckout({
      lineItems: providerLineItems,
      totalCents,
      orderId,
      origin,
    })

    // Store pending order in KV
    const order: Order = {
      id: orderId,
      items: lineItems,
      total,
      status: 'pending',
      providerSessionId: result.providerSessionId,
      paymentProvider: provider.name,
      // Backward compat
      stripeSessionId: result.providerSessionId,
      source: 'online',
      paymentMethod: 'online',
      createdAt: now,
      updatedAt: now,
    }

    const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null ?? []
    orders.push(order)
    await context.env.CONTENT.put('orders', JSON.stringify(orders))

    return Response.json({
      success: true,
      clientSecret: result.clientSecret,
      checkoutUrl: result.checkoutUrl,
    })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ success: false, error: errMsg }, { status: 500 })
  }
}
