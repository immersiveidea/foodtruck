/**
 * Shared date/time formatting utilities
 * Used by ScheduleSection, AdminPage, and BookingPage components
 */

/**
 * Parse an ISO date string (YYYY-MM-DD) into a Date object
 * Uses local date construction to avoid timezone issues
 */
export function parseISODate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.includes('-')) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

/**
 * Format a 24-hour time string (HH:MM) to 12-hour format (e.g., "2pm", "11:30am")
 */
export function formatTime(time: string): string {
  if (!time || !time.includes(':')) return ''
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours || '0', 10)
  if (isNaN(h)) return ''
  const suffix = h >= 12 ? 'pm' : 'am'
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return minutes === '00' ? `${displayHour}${suffix}` : `${displayHour}:${minutes}${suffix}`
}

/**
 * Format a time range from two 24-hour time strings
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = formatTime(startTime)
  const end = formatTime(endTime)
  if (!start || !end) return ''
  return `${start} - ${end}`
}

/**
 * Get the day of week from an ISO date string (e.g., "Monday")
 */
export function formatDayOfWeek(dateStr: string): string {
  const date = parseISODate(dateStr)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

/**
 * Format an ISO date string as a short display date (e.g., "Jan 25")
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseISODate(dateStr)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format an ISO date string as a full date (e.g., "January 25, 2025")
 */
export function formatFullDate(dateStr: string): string {
  const date = parseISODate(dateStr)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Format an ISO timestamp (from server) for display with date and time
 */
export function formatTimestamp(isoTimestamp: string): string {
  if (!isoTimestamp) return ''
  const date = new Date(isoTimestamp)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Composable hook that returns all formatting functions
 */
export function useDateTimeFormat() {
  return {
    parseISODate,
    formatTime,
    formatTimeRange,
    formatDayOfWeek,
    formatDisplayDate,
    formatFullDate,
    formatTimestamp
  }
}
