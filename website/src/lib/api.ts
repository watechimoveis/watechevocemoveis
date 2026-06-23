/** Base da API em produção (Render). Em dev, vazio = proxy Vite em /api e /uploads */
const PRODUCTION_API_ORIGIN = 'https://watech-api.onrender.com'

export const API_ORIGIN = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PRODUCTION_API_ORIGIN : '')
).replace(/\/$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_ORIGIN}${normalized}`
}

/** URLs de upload retornam path relativo (/uploads/...) — prefixar origem da API quando necessário */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return apiUrl(url)
}
