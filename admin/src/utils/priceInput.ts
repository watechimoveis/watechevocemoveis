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
