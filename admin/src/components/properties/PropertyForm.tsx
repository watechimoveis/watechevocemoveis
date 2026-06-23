import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { propertyPublicUrl } from '../../lib/site'
import { listAgents } from '../../services/agentsService'
import { uploadPropertyImages } from '../../services/propertiesService'
import { whatsappConversionRate } from '../../utils/analytics'
import type { Property, PropertyPayload, PropertyType } from '../../types/property'
import { LISTING_LABELS, PROPERTY_TYPE_LABELS } from '../../types/property'
import type { User } from '../../types/user'
import { formatWhatsAppPhone, getAgentInitials } from '../../utils/agent'
import { digitsToNumber, formatPriceDigits, parsePriceDigits } from '../../utils/priceInput'
import { Input, Textarea } from '../ui/Input'
import { PropertyImages } from './PropertyImages'

interface PropertyFormProps {
  property?: Property | null
  onSubmit: (payload: PropertyPayload) => Promise<Property | void>
  onCancel: () => void
  onPropertyChange?: (property: Property) => void
  onSuccess?: (result: { property: Property; photosUploaded: number; isNew: boolean }) => void
  loading?: boolean
}

const LISTING_TYPES = ['sale', 'rent'] as const

const CATEGORIES: {
  value: PropertyType
  label: string
  hint: string
  icon: string
}[] = [
  { value: 'land', label: 'Terreno', hint: 'Lote, área, condomínio', icon: '🏞️' },
  { value: 'house', label: 'Casa', hint: 'Térrea, sobrado, chácara', icon: '🏠' },
  { value: 'apartment', label: 'Apartamento', hint: 'Flat, cobertura, kitnet', icon: '🏢' },
]

const TITLE_PLACEHOLDERS: Record<PropertyType, string> = {
  land: 'Ex: Terreno 360m² em condomínio fechado',
  house: 'Ex: Casa térrea 3 quartos com quintal',
  apartment: 'Ex: Apartamento 3 quartos no Centro',
}

const DESCRIPTION_PLACEHOLDERS: Record<PropertyType, string> = {
  land: 'Topografia, zoneamento, infraestrutura (água, luz), acesso…',
  house: 'Detalhes da casa, acabamento, área externa, condomínio…',
  apartment: 'Detalhes do apartamento, condomínio, lazer, mobília…',
}

const LAND_TAGS = ['Investimento', 'Construção', 'Comércio', 'Plano', 'Esquina', 'Declive']
const RESIDENTIAL_TAGS = ['Mobiliado', 'Aceita pet', 'Condomínio', 'Garagem', 'Novo', 'Reformado']

function toFormValue(value: string | number | null | undefined): string {
  if (value == null) return ''
  return String(value)
}

function parseNumber(value: string): number | undefined {
  return digitsToNumber(parsePriceDigits(value))
}

function parseIntField(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const num = parseInt(trimmed, 10)
  return Number.isNaN(num) ? undefined : num
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 sm:w-auto">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium sm:flex-none ${
              value === option.value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CategorySelector({
  value,
  onChange,
}: {
  value: PropertyType
  onChange: (value: PropertyType) => void
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">Categoria</p>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            className={`rounded-xl border px-3 py-3 text-left transition ${
              value === cat.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl" aria-hidden="true">
              {cat.icon}
            </span>
            <p className={`mt-1 text-sm font-semibold ${value === cat.value ? 'text-blue-800' : 'text-slate-900'}`}>
              {cat.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{cat.hint}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function suggestTitle(
  propertyType: PropertyType,
  listingType: 'sale' | 'rent',
  location: string,
  size: string,
  rooms: string,
): string | null {
  const place = location.split(',')[0]?.trim()
  if (!place && !size && !rooms) return null

  if (propertyType === 'land') {
    if (!size) return place ? `Terreno — ${place}` : null
    return place ? `Terreno ${size}m² — ${place}` : `Terreno ${size}m²`
  }

  const typeLabel = PROPERTY_TYPE_LABELS[propertyType]
  const rentSuffix = listingType === 'rent' ? ' para alugar' : ''
  if (rooms) {
    const q = parseInt(rooms, 10)
    const qt = q === 1 ? '1 quarto' : `${q} quartos`
    return place ? `${typeLabel} ${qt}${rentSuffix} — ${place}` : `${typeLabel} ${qt}${rentSuffix}`
  }

  return place ? `${typeLabel}${rentSuffix} — ${place}` : null
}

function CreatedBanner({ propertyId, photoCount }: { propertyId: string; photoCount: number }) {
  const [copied, setCopied] = useState(false)
  const url = propertyPublicUrl(propertyId)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copie o link do anúncio:', url)
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
      <p className="font-semibold">
        Anúncio publicado no site{photoCount > 0 ? ` com ${photoCount} foto(s)` : ''}!
      </p>
      <p className="mt-0.5 text-emerald-800/90">
        Compartilhe o link com interessados ou clique em <strong>Concluir</strong>.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs font-medium text-emerald-700 underline decoration-emerald-400/60 hover:text-emerald-900"
        >
          {url}
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>
      </div>
    </div>
  )
}

export function PropertyForm({ property, onSubmit, onCancel, onPropertyChange, onSuccess, loading }: PropertyFormProps) {
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
  const [propertyType, setPropertyType] = useState<PropertyType>('land')
  const [listingType, setListingType] = useState<'sale' | 'rent'>('sale')
  const [agentUserId, setAgentUserId] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [justCreated, setJustCreated] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [publishedPhotos, setPublishedPhotos] = useState(0)

  const isLand = propertyType === 'land'
  const isNew = !property?.id
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
    setPrice(property?.price != null ? String(Math.round(property.price)) : '')
    setDescription(toFormValue(property?.description))
    setRooms(toFormValue(property?.rooms))
    setBathrooms(toFormValue(property?.bathrooms))
    setParking(toFormValue(property?.parking))
    setSize(toFormValue(property?.size))
    setPropertyType(property?.property_type || 'land')
    setListingType(property?.listing_type || 'sale')
    setAgentUserId(property?.agent_user_id || '')
    setPendingPhotos([])
    setFieldErrors({})
    setJustCreated(false)
    setPhotoError('')
    setPublishedPhotos(0)
  }, [property])

  function handlePropertyTypeChange(next: PropertyType) {
    setPropertyType(next)
    if (next === 'land') {
      setRooms('')
      setBathrooms('')
      setParking('')
    }
  }

  function appendTag(tag: string) {
    const bullet = `• ${tag}`
    if (description.includes(tag)) return
    setDescription(description.trim() ? `${description.trim()}\n${bullet}` : bullet)
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!title.trim() && !titleSuggestion) errors.title = 'Informe um título para o anúncio'
    if (!location.trim()) errors.location = 'Informe bairro ou cidade'
    if (!price.trim() || parseNumber(price) == null) {
      errors.price = listingType === 'rent' ? 'Informe o valor do aluguel' : 'Informe o preço'
    }
    if (isLand && !size.trim()) errors.size = 'Informe a área do terreno'
    return errors
  }

  function scrollToFirstError(errors: Record<string, string>) {
    const first = Object.keys(errors)[0]
    if (!first) return
    document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const titleSuggestion = suggestTitle(propertyType, listingType, location, size, rooms)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(errors)
      return
    }

    setPhotoError('')
    const payload: PropertyPayload = {
      title: (title.trim() || titleSuggestion || '').trim(),
      location: location.trim(),
      price: parseNumber(price),
      description: description.trim() || undefined,
      rooms: isLand ? null : parseIntField(rooms),
      bathrooms: isLand ? null : parseIntField(bathrooms),
      parking: isLand ? null : parseIntField(parking),
      size: parseNumber(size),
      property_type: propertyType,
      listing_type: listingType,
    }

    if (isAdmin && agentUserId) {
      payload.agent_user_id = agentUserId
    }

    const wasNew = isNew
    const saved = await onSubmit(payload)
    if (!saved?.id) return

    let photosUploaded = saved.images?.length ?? 0

    if (pendingPhotos.length > 0) {
      setUploadingPhotos(true)
      try {
        const uploaded = await uploadPropertyImages(saved.id, pendingPhotos)
        const next = { ...saved, images: [...(saved.images ?? []), ...uploaded] }
        photosUploaded = next.images.length
        onPropertyChange?.(next)
        setPendingPhotos([])
      } catch {
        setPhotoError('Imóvel salvo, mas falhou ao enviar fotos. Adicione novamente abaixo.')
        photosUploaded = saved.images?.length ?? 0
      } finally {
        setUploadingPhotos(false)
      }
    }

    if (wasNew) {
      setJustCreated(true)
      setPublishedPhotos(photosUploaded)
    } else {
      setJustCreated(false)
    }
    onSuccess?.({ property: saved, photosUploaded, isNew: wasNew })
  }

  function handleImagesChange(images: Property['images']) {
    if (!property || !onPropertyChange) return
    onPropertyChange({ ...property, images })
  }

  const isSaving = loading || uploadingPhotos
  const summaryParts = [
    PROPERTY_TYPE_LABELS[propertyType],
    LISTING_LABELS[listingType],
    location.trim() || null,
    price.trim() ? formatPriceDigits(price) : null,
  ].filter(Boolean)

  return (
    <form id="property-form" onSubmit={handleSubmit} className="flex flex-col">
      <div className="space-y-6 pb-4">
      {justCreated && property?.id && (
        <CreatedBanner propertyId={property.id} photoCount={publishedPhotos} />
      )}

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
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Corretor responsável</h3>
          <select
            value={agentUserId}
            onChange={(e) => setAgentUserId(e.target.value)}
            required={isNew}
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
          {isNew && !agentUserId && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              O imóvel só aparece no site quando vinculado a um corretor com WhatsApp.
            </p>
          )}
        </section>
      )}

      <section className="space-y-4">
        <CategorySelector value={propertyType} onChange={handlePropertyTypeChange} />

        <SegmentedControl
          label="Negócio"
          value={listingType}
          options={LISTING_TYPES.map((type) => ({ value: type, label: LISTING_LABELS[type] }))}
          onChange={setListingType}
        />

        {summaryParts.length >= 2 && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-800">Prévia:</span> {summaryParts.join(' · ')}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div id="field-price">
            <Input
              label={listingType === 'rent' ? 'Aluguel mensal' : 'Preço'}
              name="price"
              type="text"
              inputMode="numeric"
              required
              placeholder="R$ 0"
              value={formatPriceDigits(price)}
              error={fieldErrors.price}
              onChange={(e) => setPrice(parsePriceDigits(e.target.value))}
            />
          </div>
          <div id="field-location">
            <Input
              label="Localização"
              name="location"
              required
              placeholder="Ex: Centro, Campos dos Goytacazes"
              value={location}
              error={fieldErrors.location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div id="field-title">
          <Input
            label="Título"
            name="title"
            required
            placeholder={TITLE_PLACEHOLDERS[propertyType]}
            value={title}
            error={fieldErrors.title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={isNew}
          />
          {titleSuggestion && title.trim() !== titleSuggestion && (
            <button
              type="button"
              onClick={() => setTitle(titleSuggestion)}
              className="mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Usar sugestão: “{titleSuggestion}”
            </button>
          )}
        </div>

        {isLand ? (
          <div id="field-size">
            <Input
              label="Área do terreno (m²)"
              name="size"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Ex: 360"
              value={size}
              error={fieldErrors.size}
              onChange={(e) => setSize(e.target.value)}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-4">
            <Input label="Quartos" name="rooms" type="number" min="0" value={rooms} onChange={(e) => setRooms(e.target.value)} />
            <Input label="Banheiros" name="bathrooms" type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
            <Input label="Vagas" name="parking" type="number" min="0" value={parking} onChange={(e) => setParking(e.target.value)} />
            <Input label="Área (m²)" name="size" type="number" min="0" step="0.01" value={size} onChange={(e) => setSize(e.target.value)} />
          </div>
        )}

        <div>
          <Textarea
            label="Descrição"
            name="description"
            placeholder={DESCRIPTION_PLACEHOLDERS[propertyType]}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {(isLand ? LAND_TAGS : RESIDENTIAL_TAGS).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-500">Destaques:</span>
              {(isLand ? LAND_TAGS : RESIDENTIAL_TAGS).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendTag(tag)}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-blue-100 hover:text-blue-800"
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {property?.id && !justCreated && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-blue-900">Performance nos últimos 7 dias</h3>
            <a
              href={propertyPublicUrl(property.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Ver no site ↗
            </a>
          </div>
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

      <PropertyImages
        property={property}
        pendingFiles={pendingPhotos}
        onPendingChange={setPendingPhotos}
        onChange={property?.id ? handleImagesChange : undefined}
      />

      {photoError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{photoError}</p>
      )}
      </div>

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <button type="button" onClick={onCancel} disabled={isSaving} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          {justCreated ? 'Concluir' : 'Cancelar'}
        </button>
        <button
          type="submit"
          disabled={isSaving || !canSubmitAsAdmin || !canSubmitAsAgent}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving
            ? uploadingPhotos
              ? 'Enviando fotos…'
              : 'Salvando…'
            : justCreated || !isNew
              ? 'Salvar alterações'
              : pendingPhotos.length > 0
                ? `Criar com ${pendingPhotos.length} foto(s)`
                : 'Criar imóvel'}
        </button>
      </div>
    </form>
  )
}