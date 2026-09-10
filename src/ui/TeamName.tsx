import { cn } from '@/lib/utils'

interface Props {
  name: string | null | undefined
  side: 'radiant' | 'dire'
  className?: string
}

/**
 * Имя команды с запасным вариантом по стороне.
 *
 * Запасной вариант был продублирован в четырёх местах и везде записан руками; здесь он
 * один. Цвет ставится тут же, потому что сторону обязаны кодировать и цвет, и подпись —
 * зелёный с красным сам по себе для части читателей неразличим.
 */
export function TeamName({ name, side, className }: Props) {
  return (
    <span className={cn(side === 'radiant' ? 'text-radiant' : 'text-dire', className)}>
      {name ?? (side === 'radiant' ? 'Radiant' : 'Dire')}
    </span>
  )
}
