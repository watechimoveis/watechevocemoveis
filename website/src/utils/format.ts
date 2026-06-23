import type { ListingType } from '../types/property'

export function formatPrice(
  value: number | null | undefined,
  listingType: ListingType = 'sale',
): string {
  if (value == null) return 'Consulte'
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
  return listingType === 'rent' ? `${formatted}/mês` : formatted
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function propertyWhatsAppMessage(property: {
  id?: string
  title?: string | null
  location?: string | null
  price?: number | null
  listing_type?: ListingType
  property_type?: string
  agent_name?: string | null
}): string {
  const title = property.title || 'imóvel'
  const location = property.location ? ` em ${property.location}` : ''
  const price =
    property.price != null && property.listing_type
      ? formatPrice(property.price, property.listing_type)
      : null
  const greeting = property.agent_name?.trim()
    ? `Olá, ${property.agent_name.trim()}!`
    : 'Olá!'

  const typeLabel =
    property.property_type === 'land'
      ? 'Terreno'
      : property.property_type === 'house'
        ? 'Casa'
        : property.property_type === 'apartment'
          ? 'Apartamento'
          : null

  const lines = [
    `${greeting} Tenho interesse no ${typeLabel ? `${typeLabel.toLowerCase()} ` : ''}"${title}"${location}.`,
    price ? `Valor: ${price}.` : null,
    property.id ? `Link: ${window.location.origin}/imovel/${property.id}` : null,
    'Poderia me passar mais informações ou agendar uma visita?',
  ]

  return lines.filter(Boolean).join('\n')
}
