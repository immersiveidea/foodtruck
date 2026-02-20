interface Env {
  CONTENT: KVNamespace
}

interface Order {
  id: string
  items: { categoryId: string; itemName: string; quantity: number; unitPrice: number }[]
  total: number
  customerName?: string
  customerEmail?: string
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  providerSessionId?: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
  adminNotes?: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    return Response.json({ success: false, error: 'Missing session_id parameter' }, { status: 400 })
  }

  const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null ?? []
  // Check providerSessionId first, fall back to stripeSessionId for old orders
  const order = orders.find(o => o.providerSessionId === sessionId || o.stripeSessionId === sessionId)

  if (!order) {
    return Response.json({ success: false, error: 'Order not found' }, { status: 404 })
  }

  // Return limited public info (no admin notes)
  return Response.json({
    id: order.id,
    items: order.items,
    total: order.total,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: order.status,
    createdAt: order.createdAt
  })
}
