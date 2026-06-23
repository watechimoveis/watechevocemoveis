import { Link } from 'react-router-dom'
import { mediaUrl } from '../../lib/api'
import { recordPropertyEvent } from '../../services/analyticsService'
import type { Property } from '../../types/property'
import { getCoverImage, LISTING_LABELS } from '../../types/property'
import { getAgentFirstName } from '../../utils/agent'
import { buildWhatsAppUrl, formatPrice, propertyWhatsAppMessage } from '../../utils/format'
import { WhatsAppButton } from '../ui/WhatsAppButton'

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const whatsappUrl = buildWhatsAppUrl(
    property.agent_whatsapp,
    propertyWhatsAppMessage(property),
  )
  const agentLabel = property.agent_name ? getAgentFirstName(property.agent_name) : null
  const creciLabel = property.agent_creci ? `CRECI ${property.agent_creci}` : null
  const cover = getCoverImage(property)
  const coverSrc = mediaUrl(cover)

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/imovel/${property.id}`} className="relative block">
        <div className="aspect-[4/3] bg-slate-100">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={property.title || 'Imóvel'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        <span className="absolute left-2 top-2 rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          {LISTING_LABELS[property.listing_type]}
        </span>
        {property.images.length > 1 && (
          <span className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white">
            {property.images.length} fotos
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/imovel/${property.id}`}>
          <p className="text-xl font-bold text-slate-900">
            {formatPrice(property.price, property.listing_type)}
          </p>
          <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-slate-800">
            {property.title || 'Imóvel disponível'}
          </h3>
          {property.location && (
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{property.location}</p>
          )}
          {creciLabel && (
            <p className="mt-1 text-xs text-slate-400">{creciLabel}</p>
          )}
        </Link>

        <PropertyFeatures property={property} />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            to={`/imovel/${property.id}`}
            className="rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm"
          >
            Detalhes
          </Link>
          <WhatsAppButton
            href={whatsappUrl}
            size="sm"
            label={agentLabel ? agentLabel : 'WhatsApp'}
            className="!py-2 !text-xs sm:!text-sm"
            onTrackClick={() => recordPropertyEvent(property.id, 'whatsapp_click')}
          />
        </div>
      </div>
    </article>
  )
}

function PropertyFeatures({ property }: { property: Property }) {
  const features = [
    property.rooms != null && `${property.rooms} qt`,
    property.bathrooms != null && `${property.bathrooms} bh`,
    property.size != null && `${property.size} m²`,
    property.parking != null && `${property.parking} vg`,
  ].filter(Boolean)

  if (features.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {features.map((feature) => (
        <span key={feature as string} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {feature}
        </span>
      ))}
    </div>
  )
}
