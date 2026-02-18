import { ref, computed, watch } from 'vue'
import type { CartItem } from '../types'

const STORAGE_KEY = 'foodtruck-cart'

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Module-level singleton state
const items = ref<CartItem[]>(loadCart())
const isOpen = ref(false)

watch(items, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function useCart() {
  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  )

  function addItem(categoryId: string, itemName: string, unitPrice: number) {
    const existing = items.value.find(
      i => i.categoryId === categoryId && i.itemName === itemName
    )
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ categoryId, itemName, quantity: 1, unitPrice })
    }
    isOpen.value = true
  }

  function removeItem(categoryId: string, itemName: string) {
    const index = items.value.findIndex(
      i => i.categoryId === categoryId && i.itemName === itemName
    )
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  function updateQuantity(categoryId: string, itemName: string, quantity: number) {
    if (quantity < 1) {
      removeItem(categoryId, itemName)
      return
    }
    const existing = items.value.find(
      i => i.categoryId === categoryId && i.itemName === itemName
    )
    if (existing) {
      existing.quantity = quantity
    }
  }

  function clearCart() {
    items.value = []
  }

  async function fetchClientSecret(): Promise<string> {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.value.map(i => ({
          categoryId: i.categoryId,
          itemName: i.itemName,
          quantity: i.quantity
        }))
      })
    })

    const data = await res.json() as { success: boolean; clientSecret?: string; error?: string }
    if (!data.success || !data.clientSecret) {
      throw new Error(data.error || 'Checkout failed')
    }
    return data.clientSecret
  }

  return {
    items,
    isOpen,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    fetchClientSecret
  }
}
