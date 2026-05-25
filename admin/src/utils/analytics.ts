export interface PropertyStats {
  views_7d: number
  views_30d: number
  whatsapp_clicks_7d: number
  whatsapp_clicks_30d: number
}

export const EMPTY_PROPERTY_STATS: PropertyStats = {
  views_7d: 0,
  views_30d: 0,
  whatsapp_clicks_7d: 0,
  whatsapp_clicks_30d: 0,
}

export function whatsappConversionRate(stats: PropertyStats): string | null {
  if (stats.views_7d <= 0) return null
  const rate = (stats.whatsapp_clicks_7d / stats.views_7d) * 100
  return `${rate.toFixed(1).replace('.0', '')}%`
}
