const SESSION_KEY = 'watech_session_hash'

function randomHash(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`
}

export function getSessionHash(): string {
  try {
    let hash = sessionStorage.getItem(SESSION_KEY)
    if (!hash) {
      hash = randomHash()
      sessionStorage.setItem(SESSION_KEY, hash)
    }
    return hash
  } catch {
    return randomHash()
  }
}

export const SOCIAL_PROOF_MIN_VIEWS = 10

export function formatSocialProof(views7d: number): string | null {
  if (views7d < SOCIAL_PROOF_MIN_VIEWS) return null
  return `${views7d} pessoas viram este imóvel nos últimos 7 dias`
}

export function whatsappConversionRate(views: number, clicks: number): string | null {
  if (views <= 0) return null
  return `${((clicks / views) * 100).toFixed(1).replace('.0', '')}%`
}
