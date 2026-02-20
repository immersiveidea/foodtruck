import { ref, computed } from 'vue'

export interface PosOrderItem {
  categoryId: string
  itemName: string
  quantity: number
  unitPrice: number
}

const items = ref<PosOrderItem[]>([])

export function usePosOrder() {
  const total = computed(() =>
    Math.round(items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100
  )

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  function addItem(categoryId: string, itemName: string, unitPrice: number) {
    const existing = items.value.find(i => i.categoryId === categoryId && i.itemName === itemName)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ categoryId, itemName, quantity: 1, unitPrice })
    }
  }

  function incrementItem(categoryId: string, itemName: string) {
    const item = items.value.find(i => i.categoryId === categoryId && i.itemName === itemName)
    if (item) item.quantity++
  }

  function decrementItem(categoryId: string, itemName: string) {
    const index = items.value.findIndex(i => i.categoryId === categoryId && i.itemName === itemName)
    if (index === -1) return
    const item = items.value[index]!
    if (item.quantity > 1) {
      item.quantity--
    } else {
      items.value.splice(index, 1)
    }
  }

  function removeItem(categoryId: string, itemName: string) {
    const index = items.value.findIndex(i => i.categoryId === categoryId && i.itemName === itemName)
    if (index !== -1) items.value.splice(index, 1)
  }

  function clearOrder() {
    items.value = []
  }

  function getCheckoutItems() {
    return items.value.map(i => ({
      categoryId: i.categoryId,
      itemName: i.itemName,
      quantity: i.quantity
    }))
  }

  return {
    items,
    total,
    itemCount,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    clearOrder,
    getCheckoutItems
  }
}
