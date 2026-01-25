import { ref, onMounted } from 'vue'
import type { AboutContent } from '../types'
import fallbackAbout from '../data/about.json'

export function useAbout() {
  const about = ref<AboutContent>(fallbackAbout as AboutContent)
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const res = await fetch('/api/about')
      if (res.ok) {
        const data = await res.json()
        if (data.heading && data.paragraphs?.length > 0) {
          about.value = data
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load about content'
    } finally {
      loading.value = false
    }
  })

  return { about, loading, error }
}
