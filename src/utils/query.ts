/** Dev flags parsed once from the querystring (see README "Dev flags"). */

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null

export const DEBUG = params?.has('debug') ?? false
export const THEATRE = params?.has('theatre') ?? false

/** ?chapter=N — jump straight to a chapter's scroll position. */
export const START_CHAPTER: number | null = (() => {
  const raw = params?.get('chapter')
  if (raw == null) return null
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
})()

export const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
