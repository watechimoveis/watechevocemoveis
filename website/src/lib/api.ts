/** Base da API em produção (Render). Em dev, vazio = proxy Vite em /api */
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

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
