import { ref, onMounted } from 'vue'
import type { ScheduleData } from '../types'
import fallbackSchedule from '../data/schedule.json'
import { useLogger, useLoggedFetch } from './useLogger'

export function useSchedule() {
  const schedule = ref<ScheduleData>(fallbackSchedule as ScheduleData)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const logger = useLogger('useSchedule')
  const fetch = useLoggedFetch('useSchedule')

  onMounted(async () => {
    try {
      const res = await fetch('/api/schedule')
      logger.debug('API response', { status: res.status })
      if (res.ok) {
        const data = await res.json()
        logger.debug('API data received', { isArray: Array.isArray(data), length: data?.length })
        if (Array.isArray(data) && data.length > 0) {
          schedule.value = data
          logger.debug('Using API data')
        } else {
          logger.debug('Falling back to schedule.json')
        }
      }
    } catch (e) {
      logger.error('Failed to load schedule', { error: e instanceof Error ? e.message : String(e) })
      error.value = e instanceof Error ? e.message : 'Failed to load schedule'
    } finally {
      loading.value = false
    }
  })

  return { schedule, loading, error }
}
