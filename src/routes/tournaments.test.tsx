import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { rootRoute } from './root'
import { tournamentsRoute } from './tournaments'

function renderCalendar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    routeTree: rootRoute.addChildren([tournamentsRoute]),
    history: createMemoryHistory({ initialEntries: ['/tournaments'] }),
  })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

function stubApi(body: unknown) {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify(body), { status: 200 })))
}

describe('tournament calendar', () => {
  it('offers only the statuses we can actually answer', async () => {
    stubApi([])
    renderCalendar()

    // Ждём вкладку, которая обязана быть: роутер отдаёт пустой DOM на первом кадре, и
    // синхронная проверка отсутствия прошла бы, ничего не проверив.
    expect(await screen.findByRole('button', { name: 'Текущие' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Прошедшие' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Все' })).toBeInTheDocument()
  })

  it('does not offer «Предстоящие»', async () => {
    stubApi([])
    renderCalendar()

    // Не «пока нет данных», а нечем ответить в принципе: списки будущих турниров
    // генерируются из LPDB и в вики-тексте Liquipedia отсутствуют, а в доступе к LPDB
    // отказано. Вкладка, которую нечем наполнить, обещает то, чего не будет.
    expect(await screen.findByRole('button', { name: 'Текущие' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Предстоящие' })).not.toBeInTheDocument()
  })

  it('points at Liquipedia for the schedule instead of reproducing it', async () => {
    stubApi([])
    renderCalendar()

    // Матчер по «расписанию», а не по «Liquipedia»: на странице уже есть обязательная
    // ссылка атрибуции на тот же домен, и широкий матчер поймал бы именно её.
    const link = await screen.findByRole('link', { name: /расписание/i })
    expect(link).toHaveAttribute('href', 'https://liquipedia.net/dota2/Portal:Tournaments')
  })
})
