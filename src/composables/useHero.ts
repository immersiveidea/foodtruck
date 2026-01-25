import { ref, onMounted } from 'vue'
import type { HeroContent } from '../types'
import fallbackHero from '../data/hero.json'

export function useHero() {
  const hero = ref<HeroContent>(fallbackHero as HeroContent)
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const res = await fetch('/api/hero')
      if (res.ok) {
        const data = await res.json()
        if (data.title) {
          hero.value = data
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load hero content'
    } finally {
      loading.value = false
    }
  })

  return { hero, loading, error }
}
