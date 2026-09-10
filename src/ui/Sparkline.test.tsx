import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sparkline } from './Sparkline'

const CURVE = [
  { minute: 0, p_radiant: 0.5 },
  { minute: 10, p_radiant: 0.62 },
  { minute: 20, p_radiant: 0.81 },
]

describe('Sparkline', () => {
  it('draws a path through the points', () => {
    const { container } = render(<Sparkline points={CURVE} outcome={null} />)
    const path = container.querySelector('path')
    expect(path?.getAttribute('d')).toMatch(/^M/)
  })

  it('marks how the match ended', () => {
    const { container } = render(<Sparkline points={CURVE} outcome="radiant" />)
    expect(container.querySelector('circle')).toBeTruthy()
  })

  it('draws nothing for an empty curve', () => {
    const { container } = render(<Sparkline points={[]} outcome={null} />)
    expect(container.querySelector('path')).toBeNull()
  })

  it('survives a single point', () => {
    const { container } = render(
      <Sparkline points={[{ minute: 4, p_radiant: 0.5 }]} outcome={null} />,
    )
    // Одна точка не образует линии; падать на этом нельзя — так выглядит матч,
    // который поллер увидел за минуту до конца.
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
