import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TeamName } from './TeamName'

describe('TeamName', () => {
  it('names the side when the team is unknown', () => {
    render(<TeamName name={null} side="dire" />)
    expect(screen.getByText('Dire')).toBeInTheDocument()
  })

  it('prefers the real name', () => {
    render(<TeamName name="Team Spirit" side="radiant" />)
    expect(screen.getByText('Team Spirit')).toBeInTheDocument()
  })

  it('colours the name by its side', () => {
    render(<TeamName name="Falcons" side="dire" />)
    expect(screen.getByText('Falcons')).toHaveClass('text-dire')
  })
})
