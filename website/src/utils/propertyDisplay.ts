import type { Property } from '../types/property'
import { PROPERTY_TYPE_LABELS, type PropertyType } from '../types/property'

export function normalizePropertyType(value?: PropertyType | null): PropertyType {
  if (value === 'house' || value === 'apartment' || value === 'land') return value
  return 'land'
}

export function propertyTypeLabel(value?: PropertyType | null): string {
  return PROPERTY_TYPE_LABELS[normalizePropertyType(value)]
}

export function formatArea(size: number | null | undefined): string | null {
  if (size == null || size <= 0) return null
  const decimals = size >= 10_000 ? 0 : size >= 100 ? 0 : size >= 10 ? 1 : 2
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(size)} m²`
}

export function formatPricePerSqm(price: number | null | undefined, size: number | null | undefined): string | null {
  if (price == null || size == null || size <= 0) return null
  const perSqm = price / size
  return `${new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: perSqm >= 1000 ? 0 : 2,
  }).format(perSqm)}/m²`
}

export function propertyHighlights(property: Pick<Property, 'property_type' | 'rooms' | 'size' | 'parking' | 'bathrooms'>) {
  const type = normalizePropertyType(property.property_type)
  const isLand = type === 'land'

  return [
    !isLand && property.rooms != null && `${property.rooms} qt`,
    !isLand && property.bathrooms != null && `${property.bathrooms} bh`,
    !isLand && property.size != null && formatArea(property.size),
    !isLand && property.parking != null && `${property.parking} vg`,
  ].filter(Boolean) as string[]
}
