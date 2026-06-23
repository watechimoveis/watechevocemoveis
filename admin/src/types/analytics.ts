export interface AnalyticsDayPoint {
  date: string
  views: number
  whatsapp: number
}

export interface AnalyticsPropertyRank {
  id: string
  title: string | null
  views_7d: number
  whatsapp_clicks_7d: number
}

export interface AnalyticsOverview {
  totals: {
    views_7d: number
    views_30d: number
    whatsapp_clicks_7d: number
    whatsapp_clicks_30d: number
  }
  daily: AnalyticsDayPoint[]
  top_properties: AnalyticsPropertyRank[]
  conversion_rate: number | null
}
