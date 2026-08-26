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
