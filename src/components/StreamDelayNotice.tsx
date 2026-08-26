import { formatGameTime } from '@/lib/utils'

/**
 * Spec section 7.4: Steam gives us near-real-time state while the viewer watches a stream
 * delayed by minutes. Saying so is not a detail - without it the product looks like it is
 * spoiling the match.
 */
export function StreamDelayNotice({ delaySeconds }: { delaySeconds: number }) {
  if (delaySeconds <= 0) return null

  return (
    <p className="text-xs text-amber-500/80">
      Данные опережают трансляцию примерно на {formatGameTime(delaySeconds)}
    </p>
  )
}
