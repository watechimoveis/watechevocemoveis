import type { Property } from '../types/property'
import {
  DOCUMENTATION_LABELS,
  PROPERTY_TYPE_LABELS,
  TOPOGRAPHY_LABELS,
  ZONING_LABELS,
  type PropertyType,
} from '../types/property'

export function normalizePropertyType(value?: PropertyType | null): PropertyType {
  if (value === 'terreno' || value === 'lote') return value
  return 'terreno'
}

export function propertyTypeLabel(value?: PropertyType | null): string {
  return PROPERTY_TYPE_LABELS[normalizePropertyType(value)]
}

export function formatArea(size: number | null | undefined): string | null {
  if (size == null || size <= 0) return null
  const decimals = size >= 10_000 ? 0 : size >= 100 ? 0 : size >= 10 ? 1 : 2
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(size)} m²`
}

export function formatDimensions(
  frontage: number | null | undefined,
  depth: number | null | undefined,
): string | null {
  if (frontage == null || depth == null || frontage <= 0 || depth <= 0) return null
  const fmt = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
  return `${fmt(frontage)} × ${fmt(depth)} m`
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

type HighlightSource = Pick<
  Property,
  | 'size'
  | 'frontage'
  | 'depth'
  | 'zoning'
  | 'topography'
  | 'documentation'
  | 'gated_community'
  | 'accepts_financing'
>

export function propertyHighlights(property: HighlightSource): string[] {
  return [
    formatArea(property.size),
    formatDimensions(property.frontage, property.depth),
    property.zoning ? ZONING_LABELS[property.zoning] : null,
    property.topography ? TOPOGRAPHY_LABELS[property.topography] : null,
    property.gated_community ? 'Condomínio fechado' : null,
    property.documentation ? DOCUMENTATION_LABELS[property.documentation] : null,
    property.accepts_financing ? 'Aceita financiamento' : null,
  ].filter(Boolean) as string[]
}
