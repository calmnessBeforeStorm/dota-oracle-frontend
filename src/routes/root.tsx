import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

import { Attribution } from '@/components/Attribution'

const NAV = [
  { to: '/', label: 'Live' },
  { to: '/tournaments', label: 'Турниры' },
  { to: '/accuracy', label: 'Точность' },
] as const

export const rootRoute = createRootRoute({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-800">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
          <span className="font-semibold tracking-tight">dota-oracle</span>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-neutral-400 transition hover:text-neutral-100 [&.active]:text-neutral-100"
              activeOptions={{ exact: item.to === '/' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <Attribution />
    </div>
  ),
})
