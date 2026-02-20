import Stripe from 'stripe'

interface Env {
  CONTENT: KVNamespace
  STRIPE_SECRET_KEY: string
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

interface PosTerminalIntentRequest {
  items: { categoryId: string; itemName: string; quantity: number }[]
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
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  stripePaymentIntentId: string
  source: 'pos'
  paymentMethod: 'stripe_terminal'
  createdAt: string
  updatedAt: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as PosTerminalIntentRequest

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ success: false, error: 'No items in order' }, { status: 400 })
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
        unitPrice: price
      })
    }

    const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const amountInCents = Math.round(total * 100)
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()

    // Create Stripe PaymentIntent for card-present Terminal payments
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
      metadata: { orderId }
    })

    // Store pending order in KV
    const order: Order = {
      id: orderId,
      items: lineItems,
      total: Math.round(total * 100) / 100,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      source: 'pos',
      paymentMethod: 'stripe_terminal',
      createdAt: now,
      updatedAt: now
    }

    const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null ?? []
    orders.push(order)
    await context.env.CONTENT.put('orders', JSON.stringify(orders))

    return Response.json({ success: true, clientSecret: paymentIntent.client_secret, orderId })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ success: false, error: errMsg }, { status: 500 })
  }
}
