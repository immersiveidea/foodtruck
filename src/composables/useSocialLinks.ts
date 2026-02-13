import { ref, onMounted } from 'vue'
import type { SocialLinksContent } from '../types'
import { useLogger, useLoggedFetch } from './useLogger'

export function useSocialLinks() {
  const socialLinks = ref<SocialLinksContent>({ links: [] })
  const loading = ref(true)
  const error = ref<string | null>(null)

  const logger = useLogger('useSocialLinks')
  const fetch = useLoggedFetch('useSocialLinks')

  onMounted(async () => {
    try {
      const res = await fetch('/api/sociallinks')
      if (res.ok) {
        const data = await res.json()
        if (data.links) {
          socialLinks.value = data
          logger.debug('Social links loaded from API')
        } else {
          logger.debug('No social links configured')
        }
      }
    } catch (e) {
      logger.error('Failed to load social links', { error: e instanceof Error ? e.message : String(e) })
      error.value = e instanceof Error ? e.message : 'Failed to load social links'
    } finally {
      loading.value = false
    }
  })

  return { socialLinks, loading, error }
}
