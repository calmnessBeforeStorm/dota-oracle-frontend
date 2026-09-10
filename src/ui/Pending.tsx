import { Surface } from './Surface'

/**
 * Три состояния, в которых страницы одинаковы, — и до сих пор каждая писала их сама,
 * отчего они уже разошлись между собой.
 *
 * Ошибка намеренно не красная. Красный в этой системе принадлежит Dire, и сообщение
 * «Не удалось загрузить», выкрашенное в цвет стороны, читается как утверждение о матче.
 */
export function Loading() {
  return <p className="text-body text-ink-faint">Загрузка…</p>
}

export function Failed({ message }: { message: string }) {
  return (
    <Surface level="raised" className="px-4 py-3">
      <p className="text-body text-ink-dim">{message}</p>
    </Surface>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <Surface level="raised" className="px-6 py-16 text-center">
      <p className="text-lead text-ink-dim">{title}</p>
      {hint && <p className="mt-2 text-body text-ink-faint">{hint}</p>}
    </Surface>
  )
}
