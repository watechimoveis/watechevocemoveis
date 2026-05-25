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
  agent_user_id: string | null
  listing_type: 'sale' | 'rent'
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

export type PropertyPayload = Partial<
  Omit<Property, 'id' | 'created_at' | 'updated_at' | 'images' | 'agent_name' | 'agent_creci' | 'agent_whatsapp'>
> & {
  listing_type?: 'sale' | 'rent'
  agent_user_id?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  email: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}
