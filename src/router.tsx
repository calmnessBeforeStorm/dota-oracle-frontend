import { createRouter } from '@tanstack/react-router'

import { accuracyRoute } from './routes/accuracy'
import { liveRoute } from './routes/live'
import { matchRoute } from './routes/match'
import { rootRoute } from './routes/root'
import { tournamentRoute } from './routes/tournament'
import { tournamentsRoute } from './routes/tournaments'

const routeTree = rootRoute.addChildren([
  liveRoute,
  matchRoute,
  tournamentsRoute,
  tournamentRoute,
  accuracyRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
