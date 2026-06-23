const SITE_URL = (import.meta.env.VITE_SITE_URL || 'http://localhost:5174').replace(/\/$/, '')

export function propertyPublicUrl(id: string): string {
  return `${SITE_URL}/imovel/${id}`
}
