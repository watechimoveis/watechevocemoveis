/** Dígitos crus a partir do campo (sem formatação). */
export function parsePriceDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Exibe valor numérico como moeda brasileira no input (sem centavos). */
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

export function formatAreaDigits(digits: string): string {
  if (!digits) return ''
  const amount = Number(digits)
  if (Number.isNaN(amount)) return ''
  return `${new Intl.NumberFormat('pt-BR').format(amount)} m²`
}
