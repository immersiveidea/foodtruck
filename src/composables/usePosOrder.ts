import { ref, computed } from 'vue'

export interface PosOrderItem {
  categoryId: string
  itemName: string
  quantity: number
  unitPrice: number
  notes: string[]
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
      existing.notes.push('')
    } else {
      items.value.push({ categoryId, itemName, quantity: 1, unitPrice, notes: [''] })
    }
  }

  function incrementItem(categoryId: string, itemName: string) {
    const item = items.value.find(i => i.categoryId === categoryId && i.itemName === itemName)
    if (item) {
      item.quantity++
      item.notes.push('')
    }
  }

  function decrementItem(categoryId: string, itemName: string) {
    const index = items.value.findIndex(i => i.categoryId === categoryId && i.itemName === itemName)
    if (index === -1) return
    const item = items.value[index]!
    if (item.quantity > 1) {
      item.quantity--
      item.notes.pop()
    } else {
      items.value.splice(index, 1)
    }
  }

  function removeItem(categoryId: string, itemName: string) {
    const index = items.value.findIndex(i => i.categoryId === categoryId && i.itemName === itemName)
    if (index !== -1) items.value.splice(index, 1)
  }

  function updateItemNote(categoryId: string, itemName: string, unitIndex: number, note: string) {
    const item = items.value.find(i => i.categoryId === categoryId && i.itemName === itemName)
    if (item && unitIndex >= 0 && unitIndex < item.notes.length) {
      item.notes[unitIndex] = note
    }
  }

  function clearOrder() {
    items.value = []
  }

  function getCheckoutItems() {
    return items.value.map(i => {
      const hasNotes = i.notes.some(n => n.trim() !== '')
      return {
        categoryId: i.categoryId,
        itemName: i.itemName,
        quantity: i.quantity,
        ...(hasNotes ? { notes: i.notes } : {})
      }
    })
  }

  return {
    items,
    total,
    itemCount,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    updateItemNote,
    clearOrder,
    getCheckoutItems
  }
}
