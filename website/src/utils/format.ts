export function formatPrice(value: number | null | undefined): string {
  if (value == null) return 'Consulte'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = `55${digits}`
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function propertyWhatsAppMessage(property: {
  id?: string
  title?: string | null
  location?: string | null
  price?: number | null
  property_type?: string
  agent_name?: string | null
}): string {
  const title = property.title || 'anúncio'
  const location = property.location ? ` em ${property.location}` : ''
  const price = property.price != null ? formatPrice(property.price) : null
  const greeting = property.agent_name?.trim()
    ? `Olá, ${property.agent_name.trim()}!`
    : 'Olá!'

  const typeLabel = property.property_type === 'lote' ? 'lote' : 'terreno'

  const lines = [
    `${greeting} Tenho interesse no ${typeLabel} "${title}"${location}.`,
    price ? `Valor: ${price}.` : null,
    property.id ? `Link: ${window.location.origin}/imovel/${property.id}` : null,
    'Poderia me passar mais informações ou agendar uma visita?',
  ]

  return lines.filter(Boolean).join('\n')
}
