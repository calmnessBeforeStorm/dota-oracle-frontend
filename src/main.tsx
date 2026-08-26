import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Live data goes stale fast; refetching on focus is what a viewer expects.
      staleTime: 10_000,
      retry: 2,
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('#root not found')

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
