import { useEffect } from 'react'

const DEFAULT_TITLE = 'W.A.Techevoceimoveis — Encontre seu imóvel'

export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · W.A.Techevoceimoveis` : DEFAULT_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
