import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Surface } from './Surface'

describe('Surface', () => {
  it('raises the surface above the page ground', () => {
    render(<Surface level="raised">содержимое</Surface>)
    expect(screen.getByText('содержимое')).toHaveClass('bg-raised')
  })

  it('tints the lit surface by the side that leads', () => {
    render(
      <Surface level="lit" lead="dire">
        ведёт Dire
      </Surface>,
    )
    // Свечение стороны, а не рамка: язык системы разделяет светом.
    expect(screen.getByText('ведёт Dire').className).toMatch(/shadow-.*dire/)
  })

  it('leaves a lit surface unlit when nobody leads', () => {
    render(
      <Surface level="lit" lead={null}>
        поровну
      </Surface>,
    )
    expect(screen.getByText('поровну').className).not.toMatch(/shadow-/)
  })
})
