import type { AnalyticsOverview } from '../types/analytics'
import { apiRequest } from './api'

export async function getAnalyticsOverview(days = 7): Promise<AnalyticsOverview> {
  return apiRequest<AnalyticsOverview>(`/properties/analytics/overview?days=${days}`)
}
