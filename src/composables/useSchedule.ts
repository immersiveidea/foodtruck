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
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          schedule.value = data
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load schedule'
    } finally {
      loading.value = false
    }
  })

  return { schedule, loading, error }
}
