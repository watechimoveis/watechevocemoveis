export function formatWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return phone

  if (digits.length >= 12 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4)
    const rest = digits.slice(4)
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    }
    if (rest.length === 8) {
      return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
    }
  }

  return `+${digits}`
}

export function getAgentInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function getAgentFirstName(name: string | null | undefined): string {
  if (!name?.trim()) return 'corretor'
  return name.trim().split(/\s+/)[0]
}

export function hasAgentContact(property: {
  agent_name?: string | null
  agent_whatsapp?: string | null
}): boolean {
  return Boolean(property.agent_name?.trim() || property.agent_whatsapp?.trim())
}
