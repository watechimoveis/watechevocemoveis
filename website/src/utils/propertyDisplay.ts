import type { Property } from '../types/property'
import { PROPERTY_TYPE_LABELS, type PropertyType } from '../types/property'

export function normalizePropertyType(value?: PropertyType | null): PropertyType {
  if (value === 'house' || value === 'apartment' || value === 'land') return value
  return 'land'
}

export function propertyTypeLabel(value?: PropertyType | null): string {
  return PROPERTY_TYPE_LABELS[normalizePropertyType(value)]
}

export function formatPricePerSqm(price: number | null | undefined, size: number | null | undefined): string | null {
  if (price == null || size == null || size <= 0) return null
  const perSqm = price / size
  return `${new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(perSqm)}/m²`
}

export function propertyHighlights(property: Pick<Property, 'property_type' | 'rooms' | 'size' | 'parking' | 'bathrooms'>) {
  const type = normalizePropertyType(property.property_type)
  const isLand = type === 'land'

  return [
    !isLand && property.rooms != null && `${property.rooms} qt`,
    !isLand && property.bathrooms != null && `${property.bathrooms} bh`,
    property.size != null && `${property.size} m²`,
    !isLand && property.parking != null && `${property.parking} vg`,
  ].filter(Boolean) as string[]
}
