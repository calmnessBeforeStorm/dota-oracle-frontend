import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Empty, Failed, Loading } from './Pending'

describe('Pending states', () => {
  it('says it is loading', () => {
    render(<Loading />)
    expect(screen.getByText('Загрузка…')).toBeInTheDocument()
  })

  it('does not paint a failure in a side colour', () => {
    render(<Failed message="Матч не найден" />)
    const node = screen.getByText('Матч не найден')
    // Красный принадлежит Dire. Ошибка — не сторона, и красной быть не может.
    expect(node.className).not.toMatch(/text-dire/)
  })

  it('shows the hint under an empty state', () => {
    render(<Empty title="Матчей нет" hint="Расписание — на странице «Турниры»" />)
    expect(screen.getByText('Матчей нет')).toBeInTheDocument()
    expect(screen.getByText('Расписание — на странице «Турниры»')).toBeInTheDocument()
  })
})
