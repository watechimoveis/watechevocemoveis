import type { SearchState } from '../hooks/usePropertySearch'

export function searchResultsTitle(applied: SearchState): string {
  if (applied.listingType === 'rent') return 'Aluguéis disponíveis'
  if (applied.category === 'residential') return 'Imóveis à venda'
  return 'Terrenos à venda'
}

export function searchResultsEmptyHint(applied: SearchState): string {
  if (applied.listingType === 'rent') {
    return 'Nenhum aluguel encontrado com esses filtros.'
  }
  if (applied.category === 'residential') {
    return 'Nenhum imóvel encontrado com esses filtros.'
  }
  return 'Nenhum terreno encontrado com esses filtros.'
}

export function heroCopy(applied: SearchState) {
  if (applied.listingType === 'rent') {
    return {
      title: 'Encontre o imóvel ideal para',
      highlight: 'morar bem.',
      subtitle: 'Aluguéis de casas e apartamentos com contato direto ao corretor responsável.',
    }
  }
  if (applied.category === 'residential') {
    return {
      title: 'Encontre o imóvel ideal para',
      highlight: 'chamar de lar.',
      subtitle: 'Casas e apartamentos à venda — contato direto com o corretor, sem intermediários.',
    }
  }
  return {
    title: 'Encontre o terreno ideal para',
    highlight: 'realizar seus planos.',
    subtitle: 'Terrenos para investir ou construir — contato direto ao corretor responsável.',
  }
}

export function hasActiveSearchFilters(applied: SearchState): boolean {
  return Boolean(
    applied.location.trim() ||
      applied.minPrice ||
      applied.maxPrice ||
      applied.minRooms ||
      applied.minSize ||
      applied.sort !== 'recent' ||
      applied.listingType !== 'sale' ||
      applied.category !== 'land',
  )
}
