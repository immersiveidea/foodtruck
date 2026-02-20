interface Env {
  CONTENT: KVNamespace
}

interface MenuItem {
  name: string
  price: number
}

interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface MenuData {
  categories: MenuCategory[]
}

interface PosOrderRequest {
  items: { categoryId: string; itemName: string; quantity: number; notes?: string[] }[]
  paymentMethod: 'cash' | 'card_external'
  cashTendered?: number
  customerName?: string
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
  source: 'pos'
  paymentMethod: 'cash' | 'card_external'
  cashTendered?: number
  changeDue?: number
  createdAt: string
  updatedAt: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as PosOrderRequest

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ success: false, error: 'No items in order' }, { status: 400 })
    }

    if (!['cash', 'card_external'].includes(body.paymentMethod)) {
      return Response.json({ success: false, error: 'Invalid payment method' }, { status: 400 })
    }

    // Load menu from KV to get authoritative prices
    const menuData = await context.env.CONTENT.get('menu', 'json') as MenuData | null
    if (!menuData || !menuData.categories) {
      return Response.json({ success: false, error: 'Menu not available' }, { status: 500 })
    }

    // Build price lookup
    const priceMap = new Map<string, number>()
    for (const category of menuData.categories) {
      for (const item of category.items) {
        priceMap.set(`${category.id}:${item.name}`, item.price)
      }
    }

    // Validate and build line items
    const lineItems: OrderLineItem[] = []
    for (const cartItem of body.items) {
      if (!cartItem.categoryId || !cartItem.itemName || !cartItem.quantity || cartItem.quantity < 1) {
        return Response.json({ success: false, error: `Invalid item: ${cartItem.itemName}` }, { status: 400 })
      }

      const price = priceMap.get(`${cartItem.categoryId}:${cartItem.itemName}`)
      if (price === undefined) {
        return Response.json({ success: false, error: `Item not found: ${cartItem.itemName}` }, { status: 400 })
      }

      lineItems.push({
        categoryId: cartItem.categoryId,
        itemName: cartItem.itemName,
        quantity: cartItem.quantity,
        unitPrice: price,
        ...(cartItem.notes?.length ? { notes: cartItem.notes } : {})
      })
    }

    const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const roundedTotal = Math.round(total * 100) / 100

    // Validate cash tendered
    if (body.paymentMethod === 'cash') {
      if (body.cashTendered === undefined || body.cashTendered < roundedTotal) {
        return Response.json({ success: false, error: 'Insufficient cash tendered' }, { status: 400 })
      }
    }

    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()
    const changeDue = body.paymentMethod === 'cash' ? Math.round((body.cashTendered! - roundedTotal) * 100) / 100 : undefined

    const order: Order = {
      id: orderId,
      items: lineItems,
      total: roundedTotal,
      customerName: body.customerName || undefined,
      status: 'paid',
      source: 'pos',
      paymentMethod: body.paymentMethod,
      cashTendered: body.paymentMethod === 'cash' ? body.cashTendered : undefined,
      changeDue,
      createdAt: now,
      updatedAt: now
    }

    const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null ?? []
    orders.push(order)
    await context.env.CONTENT.put('orders', JSON.stringify(orders))

    return Response.json({ success: true, order })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ success: false, error: errMsg }, { status: 500 })
  }
}
