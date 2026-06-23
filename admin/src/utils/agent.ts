export function formatWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')

  let ddd: string
  let rest: string

  if (digits.startsWith('55') && digits.length >= 12) {
    ddd = digits.slice(2, 4)
    rest = digits.slice(4)
  } else if (digits.length >= 10) {
    ddd = digits.slice(0, 2)
    rest = digits.slice(2)
  } else {
    return phone
  }

  if (rest.length === 9) return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
  if (rest.length === 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return phone
}

export function getAgentInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
