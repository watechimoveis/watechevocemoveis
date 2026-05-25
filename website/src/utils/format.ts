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
  title?: string | null
  location?: string | null
  agent_name?: string | null
}): string {
  const title = property.title || 'imóvel'
  const location = property.location ? ` em ${property.location}` : ''
  const greeting = property.agent_name?.trim()
    ? `Olá, ${property.agent_name.trim()}!`
    : 'Olá!'
  return `${greeting} Tenho interesse no imóvel "${title}"${location}. Poderia me passar mais informações?`
}
