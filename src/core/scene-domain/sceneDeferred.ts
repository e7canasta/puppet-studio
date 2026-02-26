export type SceneDeferredApplyMode = 'apply_all' | 'latest_only'

export function pushDeferredMessage<T>(queue: T[], entry: T, limit: number): T[] {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 1
  const next = [...queue, entry]
  if (next.length <= safeLimit) return next
  return next.slice(next.length - safeLimit)
}

export function selectDeferredMessagesForApply<T>(queue: T[], mode: SceneDeferredApplyMode): T[] {
  if (queue.length === 0) return []
  if (mode === 'latest_only') return [queue[queue.length - 1]]
  return [...queue]
}
