import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_TIERS, normaliseTier, readTiers, toggleTier, writeTiers } from './tiers'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('normaliseTier', () => {
  it('пропускает известные тиры', () => {
    expect(normaliseTier('tier1')).toBe('tier1')
    expect(normaliseTier('tier3')).toBe('tier3')
  })

  it('считает неизвестное неразмеченным, а не теряет его', () => {
    // Лига без разметки должна попадать в «Без разметки» и считаться там: матч, выпавший
    // из всех корзин, исчез бы из ленты молча.
    expect(normaliseTier(null)).toBe('unknown')
    expect(normaliseTier(undefined)).toBe('unknown')
    expect(normaliseTier('tier0')).toBe('unknown')
  })
})

describe('toggleTier', () => {
  it('добавляет и снимает', () => {
    expect(toggleTier(['tier1'], 'tier2')).toEqual(['tier1', 'tier2'])
    expect(toggleTier(['tier1', 'tier2'], 'tier2')).toEqual(['tier1'])
  })

  it('не даёт снять последний', () => {
    expect(toggleTier(['tier1'], 'tier1')).toEqual(['tier1'])
    expect(toggleTier(['unknown'], 'unknown')).toEqual(['unknown'])
  })

  it('держит канонический порядок независимо от порядка кликов', () => {
    const clickedBackwards = toggleTier(toggleTier(['unknown'], 'tier2'), 'tier1')
    expect(clickedBackwards).toEqual(['tier1', 'tier2', 'unknown'])
  })
})

describe('readTiers', () => {
  it('без записи отдаёт Tier 1', () => {
    expect(readTiers()).toEqual(DEFAULT_TIERS)
  })

  it('переживает круг записи и чтения', () => {
    writeTiers(['tier1', 'unknown'])
    expect(readTiers()).toEqual(['tier1', 'unknown'])
  })

  it('не принимает мусор за выбор пользователя', () => {
    // Каждая из этих строк когда-то может оказаться в ключе: чужая запись, прошлая версия
    // формата, правка руками. Пустой набор означал бы вечно пустую ленту.
    for (const junk of ['null', '"tier1"', '[]', '{"a":1}', '["tier9"]', 'не json']) {
      localStorage.setItem('live-tiers', junk)
      expect(readTiers()).toEqual(DEFAULT_TIERS)
    }
  })

  it('не падает, когда localStorage бросает', () => {
    // Приватное окно и настройки, блокирующие данные сайта: обращение бросает, а не
    // возвращает пусто.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(readTiers()).toEqual(DEFAULT_TIERS)
  })

  it('не падает, когда запись запрещена', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => writeTiers(['tier2'])).not.toThrow()
  })
})
