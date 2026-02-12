import { ref, onMounted } from 'vue'
import type { AboutContent } from '../types'
import fallbackAbout from '../data/about.json'
import { useLogger, useLoggedFetch } from './useLogger'

export function useAbout() {
  const about = ref<AboutContent>(fallbackAbout as AboutContent)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const logger = useLogger('useAbout')
  const fetch = useLoggedFetch('useAbout')

  onMounted(async () => {
    try {
      const res = await fetch('/api/about')
      if (res.ok) {
        const data = await res.json()
        if (data.heading && data.paragraphs?.length > 0) {
          about.value = data
          logger.debug('About content loaded from API', { paragraphCount: data.paragraphs.length })
        } else {
          logger.debug('Using fallback about content')
        }
      }
    } catch (e) {
      logger.error('Failed to load about content', { error: e instanceof Error ? e.message : String(e) })
      error.value = e instanceof Error ? e.message : 'Failed to load about content'
    } finally {
      loading.value = false
    }
  })

  return { about, loading, error }
}
