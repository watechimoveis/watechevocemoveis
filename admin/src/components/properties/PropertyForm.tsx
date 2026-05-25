import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listAgents } from '../../services/agentsService'
import { whatsappConversionRate } from '../../utils/analytics'
import type { Property, PropertyPayload } from '../../types/property'
import type { User } from '../../types/user'
import { formatWhatsAppPhone, getAgentInitials } from '../../utils/agent'
import { Input, Textarea } from '../ui/Input'
import { PropertyImages } from './PropertyImages'

interface PropertyFormProps {
  property?: Property | null
  onSubmit: (payload: PropertyPayload) => Promise<Property | void>
  onCancel: () => void
  onPropertyChange?: (property: Property) => void
  loading?: boolean
}

function toFormValue(value: string | number | null | undefined): string {
  if (value == null) return ''
  return String(value)
}

function parseNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const num = Number(trimmed)
  return Number.isNaN(num) ? undefined : num
}

function parseIntField(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const num = parseInt(trimmed, 10)
  return Number.isNaN(num) ? undefined : num
}

export function PropertyForm({ property, onSubmit, onCancel, onPropertyChange, loading }: PropertyFormProps) {
  const { user, isAdmin, isAgent } = useAuth()
  const [agents, setAgents] = useState<User[]>([])
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [rooms, setRooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [parking, setParking] = useState('')
  const [size, setSize] = useState('')
  const [listingType, setListingType] = useState<'sale' | 'rent'>('sale')
  const [agentUserId, setAgentUserId] = useState('')

  const selectedAgent = agents.find((a) => a.id === agentUserId)
  const canSubmitAsAdmin =
    !isAdmin ||
    Boolean(
      property?.id ||
        (agentUserId && selectedAgent?.whatsapp),
    )
  const canSubmitAsAgent = !isAgent || Boolean(user?.whatsapp)

  useEffect(() => {
    if (isAdmin) {
      listAgents().then(setAgents).catch(() => setAgents([]))
    }
  }, [isAdmin])

  useEffect(() => {
    setTitle(toFormValue(property?.title))
    setLocation(toFormValue(property?.location))
    setPrice(toFormValue(property?.price))
    setDescription(toFormValue(property?.description))
    setRooms(toFormValue(property?.rooms))
    setBathrooms(toFormValue(property?.bathrooms))
    setParking(toFormValue(property?.parking))
    setSize(toFormValue(property?.size))
    setListingType(property?.listing_type || 'sale')
    setAgentUserId(property?.agent_user_id || '')
  }, [property])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const payload: PropertyPayload = {
      title: title.trim() || undefined,
      location: location.trim() || undefined,
      price: parseNumber(price),
      description: description.trim() || undefined,
      rooms: parseIntField(rooms),
      bathrooms: parseIntField(bathrooms),
      parking: parseIntField(parking),
      size: parseNumber(size),
      listing_type: listingType,
    }

    if (isAdmin && agentUserId) {
      payload.agent_user_id = agentUserId
    }

    await onSubmit(payload)
  }

  function handleImagesChange(images: Property['images']) {
    if (!property || !onPropertyChange) return
    onPropertyChange({ ...property, images })
  }

  return (
    <form id="property-form" onSubmit={handleSubmit} className="space-y-6">
      {isAgent && user && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
              {getAgentInitials(user.name)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900">Seu perfil será vinculado a este imóvel</p>
              <p className="mt-1 text-xs text-emerald-800/80">
                Nome, CRECI e WhatsApp vêm do seu cadastro — não é possível alterar manualmente, evitando fraude.
              </p>
              <dl className="mt-3 grid gap-1 text-sm text-emerald-950">
                <div className="flex gap-2">
                  <dt className="font-medium">Nome:</dt>
                  <dd>{user.name}</dd>
                </div>
                {user.creci && (
                  <div className="flex gap-2">
                    <dt className="font-medium">CRECI:</dt>
                    <dd>{user.creci}</dd>
                  </div>
                )}
                {user.whatsapp && (
                  <div className="flex gap-2">
                    <dt className="font-medium">WhatsApp:</dt>
                    <dd>{formatWhatsAppPhone(user.whatsapp)}</dd>
                  </div>
                )}
              </dl>
              {!user.whatsapp && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  WhatsApp não cadastrado. Peça ao administrador para atualizar seu perfil.
                </p>
              )}
              {user.whatsapp && !user.creci && (
                <p className="mt-2 text-xs text-amber-700">
                  CRECI não informado — peça ao admin para completar seu cadastro.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Corretor responsável</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Selecione o corretor. Nome, CRECI e WhatsApp serão preenchidos automaticamente a partir do perfil.
          </p>
          <select
            value={agentUserId}
            onChange={(e) => setAgentUserId(e.target.value)}
            required={!property?.id}
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Selecione um corretor</option>
            {agents.filter((a) => a.is_active).map((agent) => (
              <option key={agent.id} value={agent.id} disabled={!agent.whatsapp}>
                {agent.name}
                {agent.creci ? ` — CRECI ${agent.creci}` : ''}
                {!agent.whatsapp ? ' (sem WhatsApp)' : ''}
              </option>
            ))}
          </select>
          {!property?.id && !agentUserId && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              O imóvel só aparece no site quando vinculado a um corretor com WhatsApp.
            </p>
          )}
          {selectedAgent && !selectedAgent.whatsapp && (
            <p className="mt-2 text-xs font-medium text-red-600">
              Este corretor não tem WhatsApp. Atualize o cadastro em Corretores antes de publicar.
            </p>
          )}
          {selectedAgent && !selectedAgent.creci && (
            <p className="mt-2 text-xs text-amber-700">
              CRECI não informado — recomendado para transmitir confiança no site.
            </p>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Informações do imóvel</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Tipo</p>
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {(['sale', 'rent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setListingType(type)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                    listingType === type ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {type === 'sale' ? 'Compra' : 'Aluguel'}
                </button>
              ))}
            </div>
          </div>
          <Input label="Preço (R$)" name="price" type="number" min="0" step="1" placeholder="450000" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Título" name="title" placeholder="Ex: Apartamento 3 quartos" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Input label="Localização" name="location" placeholder="Ex: Centro, São Paulo" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Input label="Quartos" name="rooms" type="number" min="0" value={rooms} onChange={(e) => setRooms(e.target.value)} />
          <Input label="Banheiros" name="bathrooms" type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
          <Input label="Vagas" name="parking" type="number" min="0" value={parking} onChange={(e) => setParking(e.target.value)} />
          <Input label="Área (m²)" name="size" type="number" min="0" step="0.01" value={size} onChange={(e) => setSize(e.target.value)} />
        </div>
        <Textarea label="Descrição" name="description" placeholder="Detalhes do imóvel…" value={description} onChange={(e) => setDescription(e.target.value)} />
      </section>

      {property?.id && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <h3 className="text-sm font-semibold text-blue-900">Performance nos últimos 7 dias</h3>
          {property.stats && (property.stats.views_7d > 0 || property.stats.whatsapp_clicks_7d > 0) ? (
            <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-blue-700/80">Visualizações</dt>
                <dd className="font-semibold text-blue-950">{property.stats.views_7d}</dd>
              </div>
              <div>
                <dt className="text-blue-700/80">Cliques WhatsApp</dt>
                <dd className="font-semibold text-blue-950">{property.stats.whatsapp_clicks_7d}</dd>
              </div>
              <div>
                <dt className="text-blue-700/80">Taxa de conversão</dt>
                <dd className="font-semibold text-blue-950">
                  {whatsappConversionRate(property.stats) ?? '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-blue-800/80">
              Ainda sem visitas ou cliques no WhatsApp. Compartilhe o link do imóvel para atrair interessados.
            </p>
          )}
        </section>
      )}

      {property?.id && onPropertyChange && (
        <PropertyImages property={property} onChange={handleImagesChange} />
      )}

      {!property?.id && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Salve o imóvel primeiro para adicionar fotos.
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} disabled={loading} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !canSubmitAsAdmin || !canSubmitAsAgent}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Salvando…' : property ? 'Salvar alterações' : 'Criar imóvel'}
        </button>
      </div>
    </form>
  )
}
