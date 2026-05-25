import { useEffect } from 'react'
import type { Property } from '../types/property'
import { getCoverImage } from '../types/property'
import { mediaUrl } from '../lib/api'
import { formatPrice } from '../utils/format'

const SITE_NAME = 'W.A.Techevoceimoveis'
const DEFAULT_TITLE = `${SITE_NAME} — Encontre seu imóvel`
const DEFAULT_DESCRIPTION =
  'Encontre imóveis para compra ou aluguel e fale direto com o corretor responsável pelo WhatsApp.'

function upsertMeta(name: string, content: string, property?: string) {
  const attr = property ? 'property' : 'name'
  const selector = property ? `meta[${attr}="${name}"]` : `meta[${attr}="${name}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(name: string, property?: string) {
  const attr = property ? 'property' : 'name'
  document.head.querySelector(`meta[${attr}="${name}"]`)?.remove()
}

function buildDescription(property: Property): string {
  const parts = [
    formatPrice(property.price, property.listing_type),
    property.location,
    property.rooms != null ? `${property.rooms} quartos` : null,
    property.size != null ? `${property.size} m²` : null,
  ].filter(Boolean)
  const summary = parts.join(' · ')
  const agent = property.agent_name ? ` Fale com ${property.agent_name} pelo WhatsApp.` : ''
  return `${property.title || 'Imóvel disponível'}${summary ? ` — ${summary}` : ''}.${agent}`
}

export function usePropertySeo(property: Property | null | undefined) {
  useEffect(() => {
    if (!property) {
      document.title = DEFAULT_TITLE
      upsertMeta('description', DEFAULT_DESCRIPTION)
      return () => {
        document.title = DEFAULT_TITLE
        removeMeta('description')
        ;['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].forEach((p) =>
          removeMeta(p, 'property'),
        )
        removeMeta('twitter:card')
      }
    }

    const title = `${property.title || 'Imóvel'} · ${SITE_NAME}`
    const description = buildDescription(property)
    const image = mediaUrl(getCoverImage(property))
    const url = `${window.location.origin}/imovel/${property.id}`

    document.title = title
    upsertMeta('description', description)
    upsertMeta('og:title', title, 'property')
    upsertMeta('og:description', description, 'property')
    upsertMeta('og:url', url, 'property')
    upsertMeta('og:type', 'website', 'property')
    upsertMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    if (image) {
      upsertMeta('og:image', image, 'property')
    } else {
      removeMeta('og:image', 'property')
    }

    return () => {
      document.title = DEFAULT_TITLE
      removeMeta('description')
      ;['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].forEach((p) =>
        removeMeta(p, 'property'),
      )
      removeMeta('twitter:card')
    }
  }, [property])
}

export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
