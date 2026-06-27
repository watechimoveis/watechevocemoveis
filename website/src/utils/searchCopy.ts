import type { SearchState } from '../hooks/usePropertySearch'

export function searchResultsTitle(applied: SearchState): string {
  if (applied.propertyType === 'lote') return 'Lotes à venda'
  if (applied.propertyType === 'terreno') return 'Terrenos à venda'
  return 'Terrenos e lotes à venda'
}

export function searchResultsEmptyHint(applied: SearchState): string {
  if (applied.propertyType === 'lote') return 'Nenhum lote encontrado com esses filtros.'
  if (applied.propertyType === 'terreno') return 'Nenhum terreno encontrado com esses filtros.'
  return 'Nenhum terreno ou lote encontrado com esses filtros.'
}

export function heroCopy(applied: SearchState) {
  if (applied.propertyType === 'lote') {
    return {
      title: 'Encontre o lote ideal para',
      highlight: 'construir com segurança.',
      subtitle: 'Lotes em loteamentos e condomínios — contato direto ao corretor responsável.',
    }
  }
  return {
    title: 'Encontre o terreno ideal para',
    highlight: 'realizar seus planos.',
    subtitle: 'Terrenos e lotes para investir ou construir — contato direto ao corretor, sem intermediários.',
  }
}

export function hasActiveSearchFilters(applied: SearchState): boolean {
  return Boolean(
    applied.propertyType ||
      applied.zoning ||
      applied.gatedCommunity ||
      applied.location.trim() ||
      applied.minPrice ||
      applied.maxPrice ||
      applied.minSize ||
      applied.maxSize ||
      applied.sort !== 'recent',
  )
}
