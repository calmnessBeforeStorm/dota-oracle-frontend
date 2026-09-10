import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Level = 'base' | 'raised' | 'lit'
type Side = 'radiant' | 'dire'

interface Props {
  level?: Level
  /** Сторона, которая ведёт. Свечение — единственное, что её отмечает на уровне `lit`. */
  lead?: Side | null
  className?: string
  children: ReactNode
}

const LEVELS: Record<Level, string> = {
  base: 'bg-ground',
  raised: 'bg-raised',
  lit: 'bg-raised',
}

/**
 * Уровень подложки вместо рамки.
 *
 * Рамки вокруг каждого блока читаются как таблица, а продукт — не таблица. Разделяем
 * светом: подложка, поверхность и свечение стороны, которая ведёт.
 */
export function Surface({ level = 'raised', lead = null, className, children }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl',
        LEVELS[level],
        level === 'lit' && lead === 'radiant' && 'shadow-lit-radiant',
        level === 'lit' && lead === 'dire' && 'shadow-lit-dire',
        className,
      )}
    >
      {children}
    </div>
  )
}
