interface Env {
  CONTENT: KVNamespace
}

interface Order {
  id: string
  items: { categoryId: string; itemName: string; quantity: number; unitPrice: number; prepStatuses?: ('queued' | 'started' | 'done')[] }[]
  total: number
  customerName?: string
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  source?: 'online' | 'pos'
  paymentMethod?: string
  createdAt: string
  updatedAt: string
}

function getUnitStatus(item: { quantity: number; prepStatuses?: ('queued' | 'started' | 'done')[] }, unitIndex: number): 'queued' | 'started' | 'done' {
  return item.prepStatuses?.[unitIndex] ?? 'queued'
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null
  if (!orders) {
    return Response.json({ orders: [], timestamp: new Date().toISOString() })
  }

  const now = Date.now()
  const fifteenMinutes = 15 * 60 * 1000

  const prepOrders = orders
    .filter(o => {
      if (o.status !== 'paid') return false
      // Include if any unit is queued/started
      const hasActive = o.items.some(item => {
        for (let u = 0; u < item.quantity; u++) {
          const s = getUnitStatus(item, u)
          if (s === 'queued' || s === 'started') return true
        }
        return false
      })
      if (hasActive) return true
      // Include if all done but updated within 15 min
      const allDone = o.items.every(item => {
        for (let u = 0; u < item.quantity; u++) {
          if (getUnitStatus(item, u) !== 'done') return false
        }
        return true
      })
      if (allDone) {
        const updatedAt = new Date(o.updatedAt).getTime()
        return (now - updatedAt) < fifteenMinutes
      }
      return false
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return Response.json({ orders: prepOrders, timestamp: new Date().toISOString() })
}
