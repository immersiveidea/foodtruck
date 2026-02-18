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
  stripeSessionId: string
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
  adminNotes?: string
}

interface UpdateRequest {
  id: string
  status?: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  adminNotes?: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null
  return Response.json(orders ?? [])
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as UpdateRequest

    if (!body.id) {
      return Response.json({ success: false, error: 'Missing order id' }, { status: 400 })
    }

    const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null
    if (!orders) {
      return Response.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const index = orders.findIndex(o => o.id === body.id)
    if (index === -1) {
      return Response.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (body.status) {
      if (!['pending', 'paid', 'fulfilled', 'cancelled'].includes(body.status)) {
        return Response.json({ success: false, error: 'Invalid status' }, { status: 400 })
      }
      orders[index].status = body.status
    }

    if (body.adminNotes !== undefined) {
      orders[index].adminNotes = body.adminNotes
    }

    orders[index].updatedAt = new Date().toISOString()

    await context.env.CONTENT.put('orders', JSON.stringify(orders))

    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
