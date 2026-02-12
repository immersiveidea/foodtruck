import { ref, onMounted } from 'vue'
import type { HeroContent } from '../types'
import fallbackHero from '../data/hero.json'
import { useLogger, useLoggedFetch } from './useLogger'

export function useHero() {
  const hero = ref<HeroContent>(fallbackHero as HeroContent)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const logger = useLogger('useHero')
  const fetch = useLoggedFetch('useHero')

  onMounted(async () => {
    try {
      const res = await fetch('/api/hero')
      if (res.ok) {
        const data = await res.json()
        if (data.title) {
          hero.value = data
          logger.debug('Hero content loaded from API')
        } else {
          logger.debug('Using fallback hero content')
        }
      }
    } catch (e) {
      logger.error('Failed to load hero content', { error: e instanceof Error ? e.message : String(e) })
      error.value = e instanceof Error ? e.message : 'Failed to load hero content'
    } finally {
      loading.value = false
    }
  })

  return { hero, loading, error }
}
