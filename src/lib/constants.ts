// Activity date range
export const ACTIVITY_START = new Date('2026-02-14T00:00:00+08:00')
export const ACTIVITY_END = new Date('2026-02-22T23:59:59+08:00')
export const TOTAL_DAYS = 9

// Points configuration
export const POINTS_PER_TASK = 2
export const POINTS_PER_PHOTO = 3
export const POINTS_PER_LOTTERY_TICKET = 6

// GCS
export const UPLOAD_URL_EXPIRY_MINUTES = 15
export const MAX_PHOTO_SIZE_MB = 10
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Get activity day number (1-9) from current date
export function getActivityDay(date: Date = new Date()): number {
  const start = new Date(ACTIVITY_START)
  start.setHours(0, 0, 0, 0)
  const current = new Date(date)
  current.setHours(0, 0, 0, 0)
  const diffTime = current.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // 1-indexed
}

// Check if a given day is accessible (today or past)
export function isDayAccessible(day: number): boolean {
  const currentDay = getActivityDay()
  return day >= 1 && day <= TOTAL_DAYS && day <= currentDay
}

// Check if activity is currently active
export function isActivityActive(): boolean {
  const now = new Date()
  return now >= ACTIVITY_START && now <= ACTIVITY_END
}

// Get the date for a specific day number
export function getDateForDay(day: number): Date {
  const date = new Date(ACTIVITY_START)
  date.setDate(date.getDate() + day - 1)
  return date
}
