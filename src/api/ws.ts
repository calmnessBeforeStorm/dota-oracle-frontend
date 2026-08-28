import type { PredictionPoint } from './types'

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? ''

function wsUrl(path: string): string {
  if (WS_BASE) return `${WS_BASE}${path}`
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${path}`
}

export interface LiveUpdate extends PredictionPoint {
  match_id: number
  model_version: string
}

/**
 * Not every frame is a prediction.
 *
 * The server sends `{"type":"ping"}` whenever a match goes quiet, which is how it notices a
 * browser that has closed the tab. Passing those to `onUpdate` put an entry with no
 * `p_radiant` at the end of the curve, and the match card rendered `NaN%` as its headline
 * number within five seconds of being opened - the one number the whole product is for.
 *
 * Checked by shape rather than by excluding `type === 'ping'`, so the next control frame
 * cannot reintroduce this.
 */
function isPrediction(frame: unknown): frame is LiveUpdate {
  if (typeof frame !== 'object' || frame === null) return false
  const candidate = frame as Partial<LiveUpdate>
  return typeof candidate.minute === 'number' && typeof candidate.p_radiant === 'number'
}

/**
 * Live probability stream for one match (F5).
 *
 * Reconnects with exponential backoff: broadcasts run for hours and a dropped socket must
 * not leave a frozen number on screen pretending to be live.
 */
export function subscribeToMatch(
  matchId: number,
  onUpdate: (update: LiveUpdate) => void,
  onStatusChange?: (connected: boolean) => void,
): () => void {
  let socket: WebSocket | null = null
  let retryDelay = 1000
  let timer: ReturnType<typeof setTimeout> | undefined
  let closed = false

  const connect = () => {
    if (closed) return
    socket = new WebSocket(wsUrl(`/ws/live/${matchId}`))

    socket.onopen = () => {
      retryDelay = 1000
      onStatusChange?.(true)
    }

    socket.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data as string) as unknown
        if (isPrediction(frame)) onUpdate(frame)
      } catch {
        // A malformed frame is not worth tearing the connection down for.
      }
    }

    socket.onclose = () => {
      onStatusChange?.(false)
      if (closed) return
      timer = setTimeout(connect, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 30_000)
    }
  }

  connect()

  return () => {
    closed = true
    if (timer) clearTimeout(timer)
    socket?.close()
  }
}
