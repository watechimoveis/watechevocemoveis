import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ListingType, Property, SortOption } from '../types/property'
import { searchProperties } from '../services/propertiesService'

export interface SearchState {
  listingType: ListingType
  minPrice: string
  maxPrice: string
  sort: SortOption
}

export function usePropertySearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState<SearchState>(() => parseParams(searchParams))
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [page, setPage] = useState(() => Number(searchParams.get('page') || 1))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const applied = parseParams(searchParams)

  const load = useCallback(async (params: URLSearchParams, currentPage: number) => {
    setLoading(true)
    setError('')
    try {
      const parsed = parseParams(params)
      const data = await searchProperties({
        page: currentPage,
        listing_type: parsed.listingType,
        min_price: parsed.minPrice ? Number(parsed.minPrice) : undefined,
        max_price: parsed.maxPrice ? Number(parsed.maxPrice) : undefined,
        sort: parsed.sort,
      })
      setProperties(data.items)
      setTotal(data.total)
      setPages(data.pages)
      setPage(data.page)
    } catch {
      setError('Não foi possível carregar os imóveis.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(searchParams, Number(searchParams.get('page') || 1))
  }, [searchParams, load])

  function applySearch() {
    const next = new URLSearchParams()
    next.set('tipo', draft.listingType)
    if (draft.minPrice) next.set('min', draft.minPrice)
    if (draft.maxPrice) next.set('max', draft.maxPrice)
    next.set('ordem', draft.sort)
    next.set('page', '1')
    setSearchParams(next)
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return {
    draft,
    setDraft,
    applied,
    applySearch,
    properties,
    total,
    pages,
    page,
    goToPage,
    loading,
    error,
  }
}

function parseParams(params: URLSearchParams): SearchState {
  const tipo = params.get('tipo')
  const ordem = params.get('ordem')
  return {
    listingType: tipo === 'rent' ? 'rent' : 'sale',
    minPrice: params.get('min') || '',
    maxPrice: params.get('max') || '',
    sort: ordem === 'price_asc' || ordem === 'price_desc' ? ordem : 'recent',
  }
}
