import { apiRequest, apiUpload } from './api'
import type { Property, PropertyImage, PropertyListResponse, PropertyPayload } from '../types/property'

export async function listProperties(page = 1, limit = 20): Promise<PropertyListResponse> {
  return apiRequest<PropertyListResponse>(`/properties?page=${page}&limit=${limit}`)
}

export async function createProperty(payload: PropertyPayload): Promise<Property> {
  return apiRequest<Property>('/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProperty(id: string, payload: PropertyPayload): Promise<Property> {
  return apiRequest<Property>(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteProperty(id: string): Promise<void> {
  await apiRequest<void>(`/properties/${id}`, { method: 'DELETE' })
}

export async function uploadPropertyImages(propertyId: string, files: File[]): Promise<PropertyImage[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return apiUpload<PropertyImage[]>(`/properties/${propertyId}/images`, formData)
}

export async function deletePropertyImage(propertyId: string, imageId: string): Promise<void> {
  await apiRequest<void>(`/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' })
}
