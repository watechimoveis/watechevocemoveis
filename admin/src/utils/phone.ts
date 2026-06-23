export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function parseStoredWhatsApp(stored: string | null | undefined): { ddd: string; number: string } {
  const digits = digitsOnly(stored || '')
  let local = digits
  if (local.startsWith('55') && local.length >= 12) {
    local = local.slice(2)
  }
  if (local.length >= 10) {
    return {
      ddd: local.slice(0, 2),
      number: local.slice(2),
    }
  }
  return { ddd: '', number: '' }
}

export function normalizeWhatsAppStorage(ddd: string, number: string): string | null {
  const area = digitsOnly(ddd).slice(0, 2)
  const mobile = digitsOnly(number)
  if (area.length !== 2) return null
  if (mobile.length < 8 || mobile.length > 9) return null
  return `55${area}${mobile}`
}

export function validateWhatsAppFields(ddd: string, number: string): string | null {
  const area = digitsOnly(ddd)
  const mobile = digitsOnly(number)
  if (area.length !== 2) return 'Informe o DDD com 2 dígitos (ex: 22).'
  if (mobile.length < 8) return 'Informe o número completo com 8 ou 9 dígitos.'
  if (mobile.length > 9) return 'Número inválido — use apenas celular ou fixo local.'
  if (mobile.length === 9 && mobile[0] !== '9') {
    return 'Celular deve começar com 9 (ex: 99728-2231).'
  }
  return null
}

export function formatDddDisplay(value: string): string {
  return digitsOnly(value).slice(0, 2)
}

export function formatMobileDisplay(value: string): string {
  const digits = digitsOnly(value).slice(0, 9)
  if (digits.length <= 4) return digits
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function buildWhatsAppTestUrl(phone: string | null | undefined): string | null {
  const digits = digitsOnly(phone || '')
  if (digits.length < 12) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent('Teste de contato — W.A.Techevoceimoveis')}`
}
