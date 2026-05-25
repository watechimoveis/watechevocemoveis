export type ListingType = 'sale' | 'rent'
export type SortOption = 'recent' | 'price_asc' | 'price_desc'

export interface PropertyImage {
  id: string
  url: string
  sort_order: number
}

export interface PropertyStats {
  views_7d: number
  views_30d: number
  whatsapp_clicks_7d: number
  whatsapp_clicks_30d: number
}

export interface Property {
  id: string
  title: string | null
  listing_type: ListingType
  location: string | null
  price: number | null
  description: string | null
  rooms: number | null
  bathrooms: number | null
  parking: number | null
  size: number | null
  agent_name: string | null
  agent_creci: string | null
  agent_whatsapp: string | null
  created_at: string
  updated_at: string
  images: PropertyImage[]
  stats?: PropertyStats
}

export interface PropertyListResponse {
  items: Property[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface PropertySearchParams {
  page?: number
  limit?: number
  listing_type?: ListingType
  location?: string
  min_price?: number
  max_price?: number
  min_rooms?: number
  min_size?: number
  sort?: SortOption
}

export function getCoverImage(property: Property): string | null {
  return property.images?.[0]?.url ?? null
}

export const LISTING_LABELS: Record<ListingType, string> = {
  sale: 'Compra',
  rent: 'Aluguel',
}
