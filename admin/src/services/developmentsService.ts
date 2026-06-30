import { apiRequest } from './api'
import type {
  Development,
  DevelopmentAnalysisResponse,
  DevelopmentCostUpdatePayload,
  DevelopmentCostsResponse,
  DevelopmentListResponse,
  DevelopmentPayload,
  FinancialDashboardResponse,
  SalesProjectionMonthUpdatePayload,
  SalesProjectionResponse,
} from '../types/development'

export async function listDevelopments(): Promise<DevelopmentListResponse> {
  return apiRequest<DevelopmentListResponse>('/developments')
}

export async function getFinancialDashboard(scenarioNumber = 1): Promise<FinancialDashboardResponse> {
  return apiRequest<FinancialDashboardResponse>(`/developments/dashboard?scenario_number=${scenarioNumber}`)
}

export async function getDevelopment(id: string): Promise<Development> {
  return apiRequest<Development>(`/developments/${id}`)
}

export async function createDevelopment(payload: DevelopmentPayload): Promise<Development> {
  return apiRequest<Development>('/developments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDevelopment(id: string, payload: DevelopmentPayload): Promise<Development> {
  return apiRequest<Development>(`/developments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteDevelopment(id: string): Promise<void> {
  return apiRequest<void>(`/developments/${id}`, { method: 'DELETE' })
}

export async function getDevelopmentCosts(id: string): Promise<DevelopmentCostsResponse> {
  return apiRequest<DevelopmentCostsResponse>(`/developments/${id}/costs`)
}

export async function updateDevelopmentCosts(
  id: string,
  items: DevelopmentCostUpdatePayload[],
): Promise<DevelopmentCostsResponse> {
  return apiRequest<DevelopmentCostsResponse>(`/developments/${id}/costs`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

export async function getSalesProjection(id: string): Promise<SalesProjectionResponse> {
  return apiRequest<SalesProjectionResponse>(`/developments/${id}/sales-projection`)
}

export async function updateSalesProjection(
  id: string,
  payload: {
    projection_months?: number
    projection_mode?: 'lots' | 'percent'
    items: SalesProjectionMonthUpdatePayload[]
  },
): Promise<SalesProjectionResponse> {
  return apiRequest<SalesProjectionResponse>(`/developments/${id}/sales-projection`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getDevelopmentAnalysis(
  id: string,
  scenarioNumber = 1,
): Promise<DevelopmentAnalysisResponse> {
  return apiRequest<DevelopmentAnalysisResponse>(
    `/developments/${id}/analysis?scenario_number=${scenarioNumber}`,
  )
}
