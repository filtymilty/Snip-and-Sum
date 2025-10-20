export const createId = (prefix?: string) => {
  const fallback = Math.random().toString(36).slice(2, 10)
  const core = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : fallback
  return prefix ? `${prefix}-${core}` : core
}
