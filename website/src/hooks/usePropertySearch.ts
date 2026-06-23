import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ListingType, Property, PropertyCategory, SortOption } from '../types/property'
import { searchProperties } from '../services/propertiesService'
import { defaultSearchState } from '../utils/searchLabels'

export interface SearchState {
  listingType: ListingType
  category: PropertyCategory | ''
  location: string
  minPrice: string
  maxPrice: string
  minRooms: string
  minSize: string
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
        category: parsed.category || undefined,
        location: parsed.location.trim() || undefined,
        min_price: parsed.minPrice ? Number(parsed.minPrice) : undefined,
        max_price: parsed.maxPrice ? Number(parsed.maxPrice) : undefined,
        min_rooms: parsed.minRooms ? Number(parsed.minRooms) : undefined,
        min_size: parsed.minSize ? Number(parsed.minSize) : undefined,
        sort: parsed.sort,
      })
      setProperties(data.items)
      setTotal(data.total)
      setPages(data.pages)
      setPage(data.page)
    } catch (err) {
      setProperties([])
      setTotal(0)
      setPages(0)
      if (err instanceof TypeError) {
        setError('Não foi possível conectar ao servidor. Aguarde alguns segundos e tente novamente.')
      } else {
        setError('Não foi possível carregar os imóveis.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback(() => {
    load(searchParams, Number(searchParams.get('page') || 1))
  }, [load, searchParams])

  useEffect(() => {
    load(searchParams, Number(searchParams.get('page') || 1))
  }, [searchParams, load])

  useEffect(() => {
    setDraft(parseParams(searchParams))
  }, [searchParams])

  const applySearch = useCallback(
    (nextDraft?: SearchState) => {
      const state = nextDraft ?? draft
      setSearchParams(buildParams(state))
    },
    [draft, setSearchParams],
  )

  const clearFilters = useCallback(() => {
    const reset = defaultSearchState()
    setDraft(reset)
    setSearchParams(buildParams(reset))
  }, [setSearchParams])

  const removeFilter = useCallback(
    (key: string) => {
      const next = { ...applied }
      if (key === 'tipo') {
        next.listingType = 'sale'
        next.category = 'land'
      }
      if (key === 'local') next.location = ''
      if (key === 'min') next.minPrice = ''
      if (key === 'max') next.maxPrice = ''
      if (key === 'quartos') next.minRooms = ''
      if (key === 'area') next.minSize = ''
      if (key === 'ordem') next.sort = 'recent'
      setDraft(next)
      setSearchParams(buildParams(next))
    },
    [applied, setSearchParams],
  )

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
    clearFilters,
    removeFilter,
    properties,
    total,
    pages,
    page,
    goToPage,
    loading,
    error,
    retry,
  }
}

function buildParams(state: SearchState): URLSearchParams {
  const next = new URLSearchParams()
  next.set('tipo', state.listingType)
  if (state.category) next.set('cat', state.category)
  if (state.location.trim()) next.set('local', state.location.trim())
  if (state.minPrice) next.set('min', state.minPrice)
  if (state.maxPrice) next.set('max', state.maxPrice)
  if (state.minRooms) next.set('quartos', state.minRooms)
  if (state.minSize) next.set('area', state.minSize)
  next.set('ordem', state.sort)
  next.set('page', '1')
  return next
}

function parseParams(params: URLSearchParams): SearchState {
  const tipo = params.get('tipo')
  const cat = params.get('cat')
  const ordem = params.get('ordem')
  return {
    listingType: tipo === 'rent' ? 'rent' : 'sale',
    category: cat === 'residential' || cat === 'land' ? cat : tipo === 'rent' ? '' : 'land',
    location: params.get('local') || '',
    minPrice: params.get('min') || '',
    maxPrice: params.get('max') || '',
    minRooms: params.get('quartos') || '',
    minSize: params.get('area') || '',
    sort: ordem === 'price_asc' || ordem === 'price_desc' ? ordem : 'recent',
  }
}
