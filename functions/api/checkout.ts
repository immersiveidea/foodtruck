import Stripe from 'stripe'

interface Env {
  CONTENT: KVNamespace
  STRIPE_SECRET_KEY: string
}

interface CheckoutRequestItem {
  categoryId: string
  itemName: string
  quantity: number
}

interface MenuItem {
  name: string
  price: number
  description?: string
}

interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface MenuData {
  categories: MenuCategory[]
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
  stripeSessionId: string
  stripePaymentIntentId?: string
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

    // Load menu from KV to get authoritative prices
    const menuData = await context.env.CONTENT.get('menu', 'json') as MenuData | null
    if (!menuData || !menuData.categories) {
      return Response.json({ success: false, error: 'Menu not available' }, { status: 500 })
    }

    // Build price lookup map: "categoryId:itemName" -> price
    const priceMap = new Map<string, number>()
    const nameMap = new Map<string, string>() // for Stripe line item names
    for (const category of menuData.categories) {
      for (const item of category.items) {
        const key = `${category.id}:${item.name}`
        priceMap.set(key, item.price)
        nameMap.set(key, `${item.name} (${category.name})`)
      }
    }

    // Validate cart items and build line items
    const lineItems: OrderLineItem[] = []
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    for (const cartItem of body.items) {
      if (!cartItem.categoryId || !cartItem.itemName || !cartItem.quantity) {
        return Response.json({ success: false, error: 'Invalid cart item' }, { status: 400 })
      }

      if (cartItem.quantity < 1 || cartItem.quantity > 50) {
        return Response.json({ success: false, error: `Invalid quantity for ${cartItem.itemName}` }, { status: 400 })
      }

      const key = `${cartItem.categoryId}:${cartItem.itemName}`
      const price = priceMap.get(key)
      if (price === undefined) {
        return Response.json({ success: false, error: `Item not found: ${cartItem.itemName}` }, { status: 400 })
      }

      lineItems.push({
        categoryId: cartItem.categoryId,
        itemName: cartItem.itemName,
        quantity: cartItem.quantity,
        unitPrice: price
      })

      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: nameMap.get(key) || cartItem.itemName
          },
          unit_amount: Math.round(price * 100) // Convert to cents
        },
        quantity: cartItem.quantity
      })
    }

    const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()

    // Create Stripe Checkout Session
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY)
    const origin = new URL(context.request.url).origin

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      line_items: stripeLineItems,
      mode: 'payment',
      return_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        orderId
      }
    })

    // Store pending order in KV
    const order: Order = {
      id: orderId,
      items: lineItems,
      total,
      status: 'pending',
      stripeSessionId: session.id,
      createdAt: now,
      updatedAt: now
    }

    const orders = await context.env.CONTENT.get('orders', 'json') as Order[] | null ?? []
    orders.push(order)
    await context.env.CONTENT.put('orders', JSON.stringify(orders))

    return Response.json({ success: true, clientSecret: session.client_secret })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ success: false, error: errMsg }, { status: 500 })
  }
}
