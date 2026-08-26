import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { tournamentsQuery } from '@/api/queries'
import { cn } from '@/lib/utils'
import { rootRoute } from './root'

const TABS = [
  { key: 'current', label: 'Текущие' },
  { key: 'upcoming', label: 'Предстоящие' },
  { key: 'past', label: 'Прошедшие' },
] as const

/** F3: Liquipedia-style tournament calendar. */
function TournamentsPage() {
  const [status, setStatus] = useState<(typeof TABS)[number]['key']>('current')
  const { data, isLoading } = useQuery(tournamentsQuery(status))

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatus(tab.key)}
            className={cn(
              'rounded px-3 py-1.5 text-sm transition',
              status === tab.key
                ? 'bg-neutral-100 text-neutral-900'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-100',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-neutral-500">Загрузка…</p>
      ) : !data || data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-800 py-16 text-center text-neutral-500">
          Пусто. Синхронизация с Liquipedia — фаза 2.
        </p>
      ) : null}
    </div>
  )
}

export const tournamentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tournaments',
  component: TournamentsPage,
})
