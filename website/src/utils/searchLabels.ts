import type { SearchState } from '../hooks/usePropertySearch'
import { PROPERTY_TYPE_LABELS, ZONING_LABELS } from '../types/property'
import { formatPriceDigits } from './priceInput'

export interface ActiveFilter {
  key: string
  label: string
}

export function buildActiveFilters(state: SearchState): ActiveFilter[] {
  const filters: ActiveFilter[] = []

  if (state.propertyType) {
    filters.push({ key: 'tipo', label: PROPERTY_TYPE_LABELS[state.propertyType] })
  }
  if (state.zoning) {
    filters.push({ key: 'zona', label: ZONING_LABELS[state.zoning] })
  }
  if (state.gatedCommunity) {
    filters.push({ key: 'cond', label: 'Condomínio fechado' })
  }
  if (state.location.trim()) {
    filters.push({ key: 'local', label: state.location.trim() })
  }
  if (state.minPrice) {
    filters.push({ key: 'min', label: `Mín. ${formatPriceDigits(state.minPrice)}` })
  }
  if (state.maxPrice) {
    filters.push({ key: 'max', label: `Máx. ${formatPriceDigits(state.maxPrice)}` })
  }
  if (state.minSize) {
    filters.push({ key: 'area', label: `≥ ${Number(state.minSize).toLocaleString('pt-BR')} m²` })
  }
  if (state.maxSize) {
    filters.push({ key: 'areaMax', label: `≤ ${Number(state.maxSize).toLocaleString('pt-BR')} m²` })
  }
  if (state.sort !== 'recent') {
    const sortLabels = { price_asc: 'Menor preço', price_desc: 'Maior preço' } as const
    filters.push({ key: 'ordem', label: sortLabels[state.sort] })
  }

  return filters
}

export function defaultSearchState(): SearchState {
  return {
    propertyType: '',
    zoning: '',
    gatedCommunity: false,
    location: '',
    minPrice: '',
    maxPrice: '',
    minSize: '',
    maxSize: '',
    sort: 'recent',
  }
}
