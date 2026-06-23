export function parsePriceDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatPriceDigits(digits: string): string {
  if (!digits) return ''
  const amount = Number(digits)
  if (Number.isNaN(amount)) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function digitsToNumber(digits: string): number | undefined {
  const trimmed = digits.trim()
  if (!trimmed) return undefined
  const num = Number(trimmed)
  return Number.isNaN(num) ? undefined : num
}

/** Converte área em m² (aceita "7900", "7900,5", "7.900,00"). */
export function parseAreaField(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed
  const num = parseFloat(normalized)
  return Number.isNaN(num) || num <= 0 ? undefined : num
}

export function formatAreaField(value: number): string {
  const decimals = value >= 10_000 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(value)} m²`
}
