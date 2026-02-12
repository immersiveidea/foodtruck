import { ref, onMounted } from 'vue'
import type { MenuData } from '../types'
import fallbackMenu from '../data/menu.json'
import { useLogger, useLoggedFetch } from './useLogger'

export function useMenu() {
  const menu = ref<MenuData>(fallbackMenu as MenuData)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const logger = useLogger('useMenu')
  const fetch = useLoggedFetch('useMenu')

  onMounted(async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        if (data.categories && data.categories.length > 0) {
          menu.value = data
          logger.debug('Menu loaded from API', { categoryCount: data.categories.length })
        } else {
          logger.debug('Using fallback menu data')
        }
      }
    } catch (e) {
      logger.error('Failed to load menu', { error: e instanceof Error ? e.message : String(e) })
      error.value = e instanceof Error ? e.message : 'Failed to load menu'
    } finally {
      loading.value = false
    }
  })

  return { menu, loading, error }
}
