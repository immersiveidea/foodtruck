import type { ProviderLineItem } from './types'

interface CartItem {
  categoryId: string
  itemName: string
  quantity: number
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

export interface ValidatedLineItems {
  lineItems: { categoryId: string; itemName: string; quantity: number; unitPrice: number }[]
  providerLineItems: ProviderLineItem[]
  totalCents: number
}

export async function validateAndBuildLineItems(
  kv: KVNamespace,
  cartItems: CartItem[]
): Promise<ValidatedLineItems> {
  const menuData = await kv.get('menu', 'json') as MenuData | null
  if (!menuData || !menuData.categories) {
    throw new Error('Menu not available')
  }

  const priceMap = new Map<string, number>()
  const nameMap = new Map<string, string>()
  for (const category of menuData.categories) {
    for (const item of category.items) {
      const key = `${category.id}:${item.name}`
      priceMap.set(key, item.price)
      nameMap.set(key, `${item.name} (${category.name})`)
    }
  }

  const lineItems: ValidatedLineItems['lineItems'] = []
  const providerLineItems: ProviderLineItem[] = []

  for (const cartItem of cartItems) {
    if (!cartItem.categoryId || !cartItem.itemName || !cartItem.quantity || cartItem.quantity < 1) {
      throw new Error(`Invalid item: ${cartItem.itemName}`)
    }

    const key = `${cartItem.categoryId}:${cartItem.itemName}`
    const price = priceMap.get(key)
    if (price === undefined) {
      throw new Error(`Item not found: ${cartItem.itemName}`)
    }

    lineItems.push({
      categoryId: cartItem.categoryId,
      itemName: cartItem.itemName,
      quantity: cartItem.quantity,
      unitPrice: price
    })

    providerLineItems.push({
      name: nameMap.get(key) || cartItem.itemName,
      unitAmountCents: Math.round(price * 100),
      quantity: cartItem.quantity
    })
  }

  const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalCents = Math.round(total * 100)

  return { lineItems, providerLineItems, totalCents }
}

export function generateOrderId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
