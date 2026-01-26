/**
 * Timezone configuration
 * Can be overridden via TIMEZONE environment variable
 */
export const DEFAULT_TIMEZONE = process.env.TIMEZONE || 'Asia/Bangkok'

/**
 * Get timezone from environment or use default
 */
export function getTimezone(): string {
  return process.env.TIMEZONE || DEFAULT_TIMEZONE
}

/**
 * Format date with configurable timezone
 */
export function formatDateWithTimezone(
  dateString: string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
  includeTime: boolean = true
): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)

    if (includeTime) {
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ` (${timezone})`
    } else {
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }
  } catch {
    return dateString
  }
}
