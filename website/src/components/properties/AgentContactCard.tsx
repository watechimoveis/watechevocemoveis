import type { Property } from '../../types/property'
import { formatWhatsAppPhone, getAgentFirstName, getAgentInitials, hasAgentContact } from '../../utils/agent'
import { buildWhatsAppUrl, propertyWhatsAppMessage } from '../../utils/format'
import { WhatsAppButton } from '../ui/WhatsAppButton'

interface AgentContactCardProps {
  property: Pick<Property, 'id' | 'agent_name' | 'agent_creci' | 'agent_whatsapp' | 'title' | 'location'>
  variant?: 'default' | 'compact'
  onWhatsAppClick?: () => void
}

export function AgentContactCard({ property, variant = 'default', onWhatsAppClick }: AgentContactCardProps) {
  const whatsappUrl = buildWhatsAppUrl(property.agent_whatsapp, propertyWhatsAppMessage(property))
  const agentName = property.agent_name?.trim()
  const phone = formatWhatsAppPhone(property.agent_whatsapp)
  const firstName = getAgentFirstName(property.agent_name)
  const ctaLabel = agentName ? `Falar com ${firstName}` : 'Falar no WhatsApp'

  if (!hasAgentContact(property)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-500">Contato do responsável não informado.</p>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <AgentIdentity name={agentName} phone={phone} />
        <WhatsAppButton href={whatsappUrl} size="sm" label={ctaLabel} onTrackClick={onWhatsAppClick} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
        <p className="text-sm font-medium text-emerald-100">Atendimento exclusivo</p>
        <h2 className="text-lg font-semibold text-white">Fale com quem conhece este imóvel</h2>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-4">
          <AgentAvatar name={agentName} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{agentName || 'Corretor responsável'}</p>
            <p className="text-sm text-slate-500">
              {property.agent_creci ? `CRECI ${property.agent_creci}` : 'Corretor responsável por este imóvel'}
            </p>
            {phone && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                <PhoneIcon />
                {phone}
              </p>
            )}
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          Tire dúvidas, agende uma visita ou solicite mais detalhes. Resposta rápida pelo WhatsApp.
        </p>

        <WhatsAppButton
          href={whatsappUrl}
          size="lg"
          fullWidth
          label={ctaLabel}
          className="mt-5"
          onTrackClick={onWhatsAppClick}
        />

        <p className="mt-3 text-center text-xs text-slate-400">
          Você será direcionado ao WhatsApp{agentName ? ` de ${firstName}` : ''}
        </p>
      </div>
    </div>
  )
}

function AgentIdentity({ name, phone }: { name?: string; phone: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AgentAvatar name={name} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{name || 'Corretor responsável'}</p>
        {phone && <p className="truncate text-xs text-slate-500">{phone}</p>}
      </div>
    </div>
  )
}

function AgentAvatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-10 w-10 text-sm' : 'h-14 w-14 text-base'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 ${sizeClass}`}
      aria-hidden="true"
    >
      {getAgentInitials(name)}
    </div>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-slate-400" fill="currentColor" aria-hidden="true">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  )
}
