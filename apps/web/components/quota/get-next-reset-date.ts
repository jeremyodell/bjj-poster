export function getNextResetDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

export function formatResetDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}
