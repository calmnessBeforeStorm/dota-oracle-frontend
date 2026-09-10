import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProbabilityDisplay } from './ProbabilityDisplay'

describe('ProbabilityDisplay', () => {
  it('shows the stream delay warning next to a live number', () => {
    // Инвариант 2: наши числа опережают эфир, и без предупреждения это спойлер.
    render(<ProbabilityDisplay pRadiant={0.68} live={{ streamDelaySeconds: 130 }} />)
    expect(screen.getByText(/опережают трансляцию/)).toBeInTheDocument()
  })

  it('names both sides even with no team names', () => {
    // Сторону обязаны кодировать три вещи; подпись — та, что работает без цвета.
    render(<ProbabilityDisplay pRadiant={0.5} />)
    expect(screen.getByText('Radiant')).toBeInTheDocument()
    expect(screen.getByText('Dire')).toBeInTheDocument()
  })

  it('shows both probabilities', () => {
    render(<ProbabilityDisplay pRadiant={0.681} />)
    expect(screen.getByText('68.1%')).toBeInTheDocument()
    expect(screen.getByText('31.9%')).toBeInTheDocument()
  })

  it('shows which way the number moved', () => {
    render(<ProbabilityDisplay pRadiant={0.68} delta={0.04} />)
    expect(screen.getByText(/▲\s*4\.0/)).toBeInTheDocument()
  })

  it('says nothing about direction when there is nothing to compare with', () => {
    render(<ProbabilityDisplay pRadiant={0.68} delta={null} />)
    expect(screen.queryByText(/▲|▼/)).not.toBeInTheDocument()
  })

  it('renders no delay warning when the match is not live', () => {
    render(<ProbabilityDisplay pRadiant={0.68} />)
    expect(screen.queryByText(/опережают трансляцию/)).not.toBeInTheDocument()
  })
})
