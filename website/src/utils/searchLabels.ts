import type { SearchState } from '../hooks/usePropertySearch'
import { LISTING_LABELS } from '../types/property'
import { formatPriceDigits } from './priceInput'

export interface ActiveFilter {
  key: string
  label: string
}

export function buildActiveFilters(state: SearchState): ActiveFilter[] {
  const filters: ActiveFilter[] = []

  filters.push({
    key: 'tipo',
    label: LISTING_LABELS[state.listingType],
  })

  if (state.location.trim()) {
    filters.push({ key: 'local', label: state.location.trim() })
  }
  if (state.minPrice) {
    filters.push({ key: 'min', label: `Mín. ${formatPriceDigits(state.minPrice)}` })
  }
  if (state.maxPrice) {
    filters.push({ key: 'max', label: `Máx. ${formatPriceDigits(state.maxPrice)}` })
  }
  if (state.minRooms) {
    filters.push({ key: 'quartos', label: `${state.minRooms}+ quartos` })
  }
  if (state.minSize) {
    filters.push({ key: 'area', label: `≥ ${Number(state.minSize).toLocaleString('pt-BR')} m²` })
  }
  if (state.sort !== 'recent') {
    const sortLabels = { price_asc: 'Menor preço', price_desc: 'Maior preço' } as const
    filters.push({ key: 'ordem', label: sortLabels[state.sort] })
  }

  return filters
}

export function defaultSearchState(): SearchState {
  return {
    listingType: 'sale',
    location: '',
    minPrice: '',
    maxPrice: '',
    minRooms: '',
    minSize: '',
    sort: 'recent',
  }
}
