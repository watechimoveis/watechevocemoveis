export type ListingType = 'sale'
export type PropertyType = 'terreno' | 'lote'
export type Zoning = 'residential' | 'commercial' | 'industrial' | 'rural' | 'mixed'
export type Topography = 'flat' | 'slope_up' | 'slope_down' | 'irregular'
export type Documentation = 'deed' | 'registration' | 'contract' | 'financing'

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  terreno: 'Terreno',
  lote: 'Lote',
}

export const ZONING_LABELS: Record<Zoning, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  rural: 'Rural',
  mixed: 'Misto',
}

export const TOPOGRAPHY_LABELS: Record<Topography, string> = {
  flat: 'Plano',
  slope_up: 'Aclive',
  slope_down: 'Declive',
  irregular: 'Irregular',
}

export const DOCUMENTATION_LABELS: Record<Documentation, string> = {
  deed: 'Escritura',
  registration: 'Matrícula',
  contract: 'Contrato / Posse',
  financing: 'Financiável',
}

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
  size: number | null
  zoning: Zoning | null
  topography: Topography | null
  frontage: number | null
  depth: number | null
  documentation: Documentation | null
  gated_community: boolean
  accepts_financing: boolean
  has_water: boolean
  has_electricity: boolean
  has_sewage: boolean
  paved_street: boolean
  development_name: string | null
  block: string | null
  lot_number: string | null
  agent_name: string | null
  agent_creci: string | null
  agent_whatsapp: string | null
  agent_user_id: string | null
  listing_type: ListingType
  property_type: PropertyType
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
  listing_type?: ListingType
  property_type?: PropertyType
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
