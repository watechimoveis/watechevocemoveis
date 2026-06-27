import { apiUrl } from '../lib/api'
import type { Property, PropertyListResponse, PropertySearchParams } from '../types/property'

function buildQuery(params: PropertySearchParams): string {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.property_type) q.set('property_type', params.property_type)
  if (params.zoning) q.set('zoning', params.zoning)
  if (params.documentation) q.set('documentation', params.documentation)
  if (params.gated_community) q.set('gated_community', 'true')
  if (params.accepts_financing) q.set('accepts_financing', 'true')
  if (params.location?.trim()) q.set('location', params.location.trim())
  if (params.min_price != null && params.min_price > 0) q.set('min_price', String(params.min_price))
  if (params.max_price != null && params.max_price > 0) q.set('max_price', String(params.max_price))
  if (params.min_size != null && params.min_size > 0) q.set('min_size', String(params.min_size))
  if (params.max_size != null && params.max_size > 0) q.set('max_size', String(params.max_size))
  if (params.sort) q.set('sort', params.sort)
  return q.toString()
}

export async function searchProperties(params: PropertySearchParams = {}): Promise<PropertyListResponse> {
  const query = buildQuery({ limit: 12, sort: 'recent', ...params })
  const response = await fetch(apiUrl(`/api/v1/properties?${query}`))
  if (!response.ok) throw new Error('Erro ao carregar imóveis')
  return response.json()
}

export async function getProperty(id: string): Promise<Property> {
  const response = await fetch(apiUrl(`/api/v1/properties/${id}`))
  if (!response.ok) throw new Error('Imóvel não encontrado')
  return response.json()
}

export async function getSimilarProperties(id: string): Promise<Property[]> {
  const response = await fetch(apiUrl(`/api/v1/properties/${id}/similar`))
  if (!response.ok) return []
  return response.json()
}
