import { ref, onMounted } from 'vue'
import type { ScheduleData } from '../types'
import fallbackSchedule from '../data/schedule.json'

export function useSchedule() {
  const schedule = ref<ScheduleData>(fallbackSchedule as ScheduleData)
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const res = await fetch('/api/schedule')
      console.log('[useSchedule] API response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('[useSchedule] API data:', data)
        console.log('[useSchedule] Is array:', Array.isArray(data), 'Length:', data?.length)
        if (Array.isArray(data) && data.length > 0) {
          schedule.value = data
          console.log('[useSchedule] Using API data')
        } else {
          console.log('[useSchedule] Falling back to schedule.json')
        }
      }
    } catch (e) {
      console.error('[useSchedule] Error:', e)
      error.value = e instanceof Error ? e.message : 'Failed to load schedule'
    } finally {
      loading.value = false
    }
  })

  return { schedule, loading, error }
}
