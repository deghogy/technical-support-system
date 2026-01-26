/**
 * Format date/time with GMT+7 (Bangkok) timezone
 */
export function formatDateGMT7(dateString: string | null | undefined): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)
    
    // Format: 19 Jan 2026, 14:30 GMT+7
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' GMT+7'
  } catch {
    return dateString
  }
}

/**
 * Format date only (no time) with GMT+7 timezone
 */
export function formatDateOnlyGMT7(dateString: string | null | undefined): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}
