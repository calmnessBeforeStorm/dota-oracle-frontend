import { describe, expect, it } from 'vitest'

import config from '../../tailwind.config.js'

/**
 * Имя цвета не должно совпадать с именем встроенного размера шрифта.
 *
 * Найдено на живой странице: значение метрики было выкрашено в цвет фона и не читалось.
 * Причина не в компоненте — цвет в конфиге назывался `base`, поэтому Tailwind сгенерировал
 * `.text-base` как цвет и перекрыл им собственную утилиту размера. То есть `text-base`,
 * одна из самых частых утилит фреймворка, красила текст в подложку и заодно молча теряла
 * размер, ради которого её и пишут.
 *
 * Ловушка срабатывает беззвучно: класс существует, вёрстка не падает, текст просто исчезает.
 * Поэтому правило проверяется на конфиге, а не ищется глазами в следующий раз.
 */
const TAILWIND_FONT_SIZES = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
]

describe('цветовые токены', () => {
  it('не занимают имена встроенных размеров шрифта', () => {
    const colours = Object.keys(config.theme?.extend?.colors ?? {})

    expect(colours).not.toHaveLength(0)
    expect(colours.filter((name) => TAILWIND_FONT_SIZES.includes(name))).toEqual([])
  })

  it('не занимают имена размеров, объявленных в самом проекте', () => {
    const colours = Object.keys(config.theme?.extend?.colors ?? {})
    const sizes = Object.keys(config.theme?.extend?.fontSize ?? {})

    expect(sizes).not.toHaveLength(0)
    expect(colours.filter((name) => sizes.includes(name))).toEqual([])
  })
})
