import { describe, expect, it } from 'vitest'

import { cn, formatGameTime, formatPercent } from './utils'

describe('cn', () => {
  it('keeps a theme font size next to a colour', () => {
    // Без настройки tailwind-merge принимает `text-micro` за цвет и оставляет только
    // последний класс — размер исчезает молча, и дельта у вероятности рисуется кеглем
    // главной цифры.
    const result = cn('text-micro', 'text-radiant')
    expect(result).toContain('text-micro')
    expect(result).toContain('text-radiant')
  })

  it('still collapses two real font sizes', () => {
    expect(cn('text-hero', 'text-micro')).toBe('text-micro')
  })

  it('still collapses two colours', () => {
    expect(cn('text-radiant', 'text-dire')).toBe('text-dire')
  })
})

describe('formatGameTime', () => {
  it('renders the clock the way the game does', () => {
    expect(formatGameTime(91)).toBe('1:31')
  })

  it('keeps pre-horn time negative', () => {
    expect(formatGameTime(-45)).toBe('-0:45')
  })
})

describe('formatPercent', () => {
  it('rounds to the requested digits', () => {
    expect(formatPercent(0.6812, 1)).toBe('68.1%')
  })
})
