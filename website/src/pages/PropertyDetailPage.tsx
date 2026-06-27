import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AgentContactCard } from '../components/properties/AgentContactCard'
import { PropertyGallery } from '../components/properties/PropertyGallery'
import { SharePropertyButton } from '../components/properties/SharePropertyButton'
import { SimilarProperties } from '../components/properties/SimilarProperties'
import { WhatsAppButton } from '../components/ui/WhatsAppButton'
import { usePropertySeo } from '../hooks/usePageTitle'
import { recordPropertyEvent } from '../services/analyticsService'
import { getProperty } from '../services/propertiesService'
import type { Property } from '../types/property'
import {
  DOCUMENTATION_LABELS,
  LISTING_LABELS,
  TOPOGRAPHY_LABELS,
  ZONING_LABELS,
} from '../types/property'
import { formatArea, formatDimensions, formatPricePerSqm, propertyTypeLabel } from '../utils/propertyDisplay'
import { formatSocialProof } from '../utils/analytics'
import { getAgentFirstName } from '../utils/agent'
import { buildWhatsAppUrl, formatPrice, propertyWhatsAppMessage } from '../utils/format'

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const viewTracked = useRef(false)

  const trackWhatsApp = useCallback(() => {
    if (!id) return
    recordPropertyEvent(id, 'whatsapp_click')
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getProperty(id!)
        if (!cancelled) setProperty(data)
      } catch {
        if (!cancelled) setError('Imóvel não encontrado.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!id || loading || error || !property || viewTracked.current) return
    viewTracked.current = true
    recordPropertyEvent(id, 'view')
  }, [id, loading, error, property])

  usePropertySeo(property)

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 xl:max-w-6xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-6 aspect-[16/9] animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-6 space-y-3">
          <div className="h-6 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
      </main>
    )
  }

  if (error || !property) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 xl:max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900">Anúncio não encontrado</h1>
        <p className="mt-2 text-slate-500">Este terreno pode ter sido removido ou o link está incorreto.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Voltar aos terrenos
        </Link>
      </main>
    )
  }

  const whatsappUrl = buildWhatsAppUrl(
    property.agent_whatsapp,
    propertyWhatsAppMessage(property),
  )
  const mobileCta = property.agent_name
    ? `Falar com ${getAgentFirstName(property.agent_name)}`
    : 'Tenho interesse — WhatsApp'

  const socialProof = formatSocialProof(property.stats?.views_7d ?? 0)

  const shareUrl = `${window.location.origin}/imovel/${property.id}`
  const dimensions = formatDimensions(property.frontage, property.depth)
  const pricePerSqm = formatPricePerSqm(property.price, property.size)
  const specs: { label: string; value: string | number }[] = []
  if (property.size != null) {
    specs.push({ label: 'Área total', value: formatArea(property.size) ?? `${property.size} m²` })
  }
  if (dimensions) specs.push({ label: 'Frente × Fundo', value: dimensions })
  if (pricePerSqm) specs.push({ label: 'Preço por m²', value: pricePerSqm })
  if (property.zoning) specs.push({ label: 'Zoneamento', value: ZONING_LABELS[property.zoning] })
  if (property.topography) specs.push({ label: 'Topografia', value: TOPOGRAPHY_LABELS[property.topography] })
  if (property.documentation) {
    specs.push({ label: 'Documentação', value: DOCUMENTATION_LABELS[property.documentation] })
  }

  const infrastructure = [
    property.has_water && 'Água',
    property.has_electricity && 'Energia',
    property.has_sewage && 'Esgoto',
    property.paved_street && 'Rua asfaltada',
    property.gated_community && 'Condomínio fechado',
    property.accepts_financing && 'Aceita financiamento',
  ].filter(Boolean) as string[]

  const development = [
    property.development_name,
    property.block ? `Quadra ${property.block}` : null,
    property.lot_number ? `Lote ${property.lot_number}` : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 xl:max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Voltar aos terrenos
        </Link>

        <div className="mt-6">
          <PropertyGallery images={property.images} title={property.title} propertyType={property.property_type} />
        </div>

        <div className="mt-8 md:grid md:grid-cols-3 md:gap-8">
          <div className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-blue-800">
                {propertyTypeLabel(property.property_type)}
              </span>
              <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {LISTING_LABELS[property.listing_type]}
              </span>
              {socialProof && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                  <EyeIcon />
                  {socialProof}
                </span>
              )}
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatPrice(property.price)}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {property.title || 'Terreno disponível'}
            </h1>
            {property.location && (
              <p className="mt-2 flex items-center gap-1.5 text-slate-500">
                <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                {property.location}
              </p>
            )}

            {development.length > 0 && (
              <p className="mt-2 text-sm font-medium text-slate-600">{development.join(' · ')}</p>
            )}

            <div className="mt-4">
              <SharePropertyButton title={property.title || 'Terreno disponível'} url={shareUrl} />
            </div>

            {specs.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{spec.label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{spec.value}</p>
                  </div>
                ))}
              </div>
            )}

            {infrastructure.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Infraestrutura e condições
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {infrastructure.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/70"
                    >
                      <CheckIcon />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.description && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Descrição</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{property.description}</p>
              </div>
            )}

            <SimilarProperties propertyId={property.id} />
          </div>

          <div className="mt-8 hidden md:mt-0 md:block">
            <div className="md:sticky md:top-24">
              <AgentContactCard property={property} onWhatsAppClick={trackWhatsApp} />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg safe-bottom md:hidden">
        <WhatsAppButton href={whatsappUrl} size="lg" fullWidth label={mobileCta} onTrackClick={trackWhatsApp} />
      </div>
      <div className="h-[calc(5rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />
    </>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.97 2.97 6.97-6.97a.75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}
