import { ref, onMounted } from 'vue'
import type { MenuData } from '../types'
import fallbackMenu from '../data/menu.json'

export function useMenu() {
  const menu = ref<MenuData>(fallbackMenu as MenuData)
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        if (data.categories && data.categories.length > 0) {
          menu.value = data
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load menu'
    } finally {
      loading.value = false
    }
  })

  return { menu, loading, error }
}
