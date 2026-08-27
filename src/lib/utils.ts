import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Seconds of game time -> mm:ss, the way every Dota client shows it. */
export function formatGameTime(seconds: number): string {
  const sign = seconds < 0 ? '-' : ''
  const abs = Math.abs(Math.trunc(seconds))
  const mm = Math.floor(abs / 60)
  const ss = abs % 60
  return `${sign}${mm}:${String(ss).padStart(2, '0')}`
}

export function formatPercent(p: number, digits = 0): string {
  return `${(p * 100).toFixed(digits)}%`
}

/** Prize pools are large and only the magnitude matters in a list. */
export function formatPrizePool(amount: number | null): string {
  if (amount === null) return '—'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 ? 1 : 0)}M`
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`
  return `$${amount}`
}

const DAY_MONTH = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

export function formatDateRange(from: string | null, to: string | null): string {
  if (!from) return '—'
  const start = new Date(from)
  const end = to ? new Date(to) : null
  if (!end || start.toDateString() === end.toDateString()) return DAY_MONTH.format(start)
  return `${DAY_MONTH.format(start)} — ${DAY_MONTH.format(end)}`
}
