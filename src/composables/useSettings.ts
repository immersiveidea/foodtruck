import { ref, onMounted } from 'vue'
import type { SiteSettings } from '../types'
import { useLogger, useLoggedFetch } from './useLogger'

const settings = ref<SiteSettings>({ onlineOrderingEnabled: false })
const loaded = ref(false)

export function useSettings() {
  const logger = useLogger('useSettings')
  const fetch = useLoggedFetch('useSettings')

  if (!loaded.value) {
    onMounted(async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          settings.value = data
          logger.debug('Settings loaded from API')
        }
      } catch (e) {
        logger.error('Failed to load settings', { error: e instanceof Error ? e.message : String(e) })
      } finally {
        loaded.value = true
      }
    })
  }

  return { settings }
}
