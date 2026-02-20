import { createPaymentProvider } from '../../lib/payments/factory'
import { validateAndBuildLineItems, generateOrderId } from '../../lib/payments/helpers'

interface Env {
  CONTENT: KVNamespace
  [key: string]: unknown
}

interface PosPaymentIntentRequest {
  items: { categoryId: string; itemName: string; quantity: number; notes?: string[] }[]
  customerName?: string
  sourceId?: string // Square: tokenized card nonce
}

interface OrderLineItem {
  categoryId: string
  itemName: string
  quantity: number
  unitPrice: number
  notes?: string[]
}

interface Order {
  id: string
  items: OrderLineItem[]
  total: number
  customerName?: string
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  providerPaymentId?: string
  paymentProvider?: string
  stripePaymentIntentId?: string
  source: 'pos'
  paymentMethod: 'pos_card'
  createdAt: string
  updatedAt: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as PosPaymentIntentRequest

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ success: false, error: 'No items in order' }, { status: 400 })
    }

    const { lineItems, providerLineItems, totalCents } = await validateAndBuildLineItems(
      context.env.CONTENT,
      body.items
    )

    const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const orderId = generateOrderId()
    const now = new Date().toISOString()

    const provider = createPaymentProvider(context.env as unknown as Record<string, string>)
    const result = await provider.createPosPayment({
      lineItems: providerLineItems,
      totalCents,
      orderId,
      sourceId: body.sourceId,
    })

    // For Square, payment is completed immediately (sourceId was charged)
    const isPaid = !result.clientSecret

    const order: Order = {
      id: orderId,
      items: lineItems,
      total: Math.round(total * 100) / 100,
      customerName: body.customerName || undefined,
      status: isPaid ? 'paid' : 'pending',
      providerPaymentId: result.providerPaymentId,
      paymentProvider: provider.name,
      stripePaymentIntentId: result.providerPaymentId,
      source: 'pos',
      paymentMethod: 'pos_card',
      createdAt: now,
      updatedAt: now,
    }

    const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null ?? []
    orders.push(order)
    await context.env.CONTENT.put('orders', JSON.stringify(orders))

    return Response.json({
      success: true,
      clientSecret: result.clientSecret,
      orderId,
      paid: isPaid,
    })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ success: false, error: errMsg }, { status: 500 })
  }
}
