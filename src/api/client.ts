const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}/api${path}`, window.location.origin)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value)
  }

  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new ApiError(response.status, `GET ${path} failed: ${response.status}`)
  }
  return (await response.json()) as T
}
