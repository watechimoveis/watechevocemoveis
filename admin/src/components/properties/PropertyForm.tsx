import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { propertyPublicUrl } from '../../lib/site'
import { listAgents } from '../../services/agentsService'
import { uploadPropertyImages } from '../../services/propertiesService'
import { whatsappConversionRate } from '../../utils/analytics'
import type {
  Documentation,
  Property,
  PropertyPayload,
  PropertyType,
  Topography,
  Zoning,
} from '../../types/property'
import {
  DOCUMENTATION_LABELS,
  PROPERTY_TYPE_LABELS,
  TOPOGRAPHY_LABELS,
  ZONING_LABELS,
} from '../../types/property'
import type { User } from '../../types/user'
import { formatWhatsAppPhone, getAgentInitials } from '../../utils/agent'
import { formatAreaField, formatPriceDigits, parseAreaField, parsePriceDigits } from '../../utils/priceInput'
import { Input, Textarea } from '../ui/Input'
import { PropertyImages } from './PropertyImages'

interface PropertyFormProps {
  property?: Property | null
  defaultPropertyType?: PropertyType
  onSubmit: (payload: PropertyPayload) => Promise<Property | void>
  onCancel: () => void
  onPropertyChange?: (property: Property) => void
  onSuccess?: (result: { property: Property; photosUploaded: number; isNew: boolean }) => void
  loading?: boolean
}

const CATEGORIES: {
  value: PropertyType
  label: string
  hint: string
  icon: string
}[] = [
  { value: 'terreno', label: 'Terreno', hint: 'Área avulsa, urbana ou rural', icon: '🏞️' },
  { value: 'lote', label: 'Lote', hint: 'Em loteamento ou condomínio', icon: '📐' },
]

const TITLE_PLACEHOLDERS: Record<PropertyType, string> = {
  terreno: 'Ex: Terreno 360m² com escritura no Centro',
  lote: 'Ex: Lote 250m² em condomínio fechado',
}

const DESCRIPTION_PLACEHOLDER =
  'Localização, acesso, vizinhança, potencial de construção, diferenciais do loteamento…'

const LAND_TAGS = ['Investimento', 'Pronto para construir', 'Documentação ok', 'Esquina', 'Plano', 'Murado']

const ZONING_OPTIONS = Object.entries(ZONING_LABELS) as [Zoning, string][]
const TOPOGRAPHY_OPTIONS = Object.entries(TOPOGRAPHY_LABELS) as [Topography, string][]
const DOCUMENTATION_OPTIONS = Object.entries(DOCUMENTATION_LABELS) as [Documentation, string][]

function toFormValue(value: string | number | null | undefined): string {
  if (value == null) return ''
  return String(value)
}

function parseNumber(value: string): number | undefined {
  const digits = parsePriceDigits(value)
  if (!digits) return undefined
  const num = Number(digits)
  return Number.isNaN(num) ? undefined : num
}

const selectClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 xl:px-3.5 xl:py-2.5 xl:text-base'

function Select<T extends string>({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string
  value: T | ''
  options: [T, string][]
  placeholder?: string
  onChange: (value: T | '') => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700 xl:text-base">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value as T | '')} className={selectClass}>
        <option value="">{placeholder ?? 'Não informado'}</option>
        {options.map(([key, optionLabel]) => (
          <option key={key} value={key}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  )
}

function CheckboxChip({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
        checked ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
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
      <div className="grid grid-cols-2 gap-2">
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

function suggestTitle(propertyType: PropertyType, location: string, size: string): string | null {
  const place = location.split(',')[0]?.trim()
  if (!place && !size) return null

  const typeLabel = PROPERTY_TYPE_LABELS[propertyType]
  if (!size) return place ? `${typeLabel} — ${place}` : null
  return place ? `${typeLabel} ${size}m² — ${place}` : `${typeLabel} ${size}m²`
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

export function PropertyForm({ property, defaultPropertyType, onSubmit, onCancel, onPropertyChange, onSuccess, loading }: PropertyFormProps) {
  const { user, isAdmin, isAgent } = useAuth()
  const [agents, setAgents] = useState<User[]>([])
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState('')
  const [frontage, setFrontage] = useState('')
  const [depth, setDepth] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('terreno')
  const [zoning, setZoning] = useState<Zoning | ''>('')
  const [topography, setTopography] = useState<Topography | ''>('')
  const [documentation, setDocumentation] = useState<Documentation | ''>('')
  const [gatedCommunity, setGatedCommunity] = useState(false)
  const [acceptsFinancing, setAcceptsFinancing] = useState(false)
  const [hasWater, setHasWater] = useState(false)
  const [hasElectricity, setHasElectricity] = useState(false)
  const [hasSewage, setHasSewage] = useState(false)
  const [pavedStreet, setPavedStreet] = useState(false)
  const [developmentName, setDevelopmentName] = useState('')
  const [block, setBlock] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [agentUserId, setAgentUserId] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [justCreated, setJustCreated] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [publishedPhotos, setPublishedPhotos] = useState(0)

  const isLote = propertyType === 'lote'
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
    setSize(toFormValue(property?.size))
    setFrontage(toFormValue(property?.frontage))
    setDepth(toFormValue(property?.depth))
    setPropertyType(property?.property_type || defaultPropertyType || 'terreno')
    setZoning(property?.zoning ?? '')
    setTopography(property?.topography ?? '')
    setDocumentation(property?.documentation ?? '')
    setGatedCommunity(Boolean(property?.gated_community))
    setAcceptsFinancing(Boolean(property?.accepts_financing))
    setHasWater(Boolean(property?.has_water))
    setHasElectricity(Boolean(property?.has_electricity))
    setHasSewage(Boolean(property?.has_sewage))
    setPavedStreet(Boolean(property?.paved_street))
    setDevelopmentName(toFormValue(property?.development_name))
    setBlock(toFormValue(property?.block))
    setLotNumber(toFormValue(property?.lot_number))
    setAgentUserId(property?.agent_user_id || '')
    setPendingPhotos([])
    setFieldErrors({})
    setJustCreated(false)
    setPhotoError('')
    setPublishedPhotos(0)
  }, [property, defaultPropertyType])

  function appendTag(tag: string) {
    const bullet = `• ${tag}`
    if (description.includes(tag)) return
    setDescription(description.trim() ? `${description.trim()}\n${bullet}` : bullet)
  }

  const titleSuggestion = suggestTitle(propertyType, location, size)

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!title.trim() && !titleSuggestion) errors.title = 'Informe um título para o anúncio'
    if (!location.trim()) errors.location = 'Informe bairro ou cidade'
    if (!price.trim() || parseNumber(price) == null) errors.price = 'Informe o preço'
    if (!size.trim()) errors.size = 'Informe a área do terreno'
    else if (parseAreaField(size) == null) errors.size = 'Informe uma área válida em m²'
    return errors
  }

  function scrollToFirstError(errors: Record<string, string>) {
    const first = Object.keys(errors)[0]
    if (!first) return
    document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

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
      size: parseAreaField(size),
      property_type: propertyType,
      listing_type: 'sale',
      zoning: zoning || null,
      topography: topography || null,
      frontage: parseAreaField(frontage),
      depth: parseAreaField(depth),
      documentation: documentation || null,
      gated_community: gatedCommunity,
      accepts_financing: acceptsFinancing,
      has_water: hasWater,
      has_electricity: hasElectricity,
      has_sewage: hasSewage,
      paved_street: pavedStreet,
      development_name: developmentName.trim() || null,
      block: block.trim() || null,
      lot_number: lotNumber.trim() || null,
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
  const parsedArea = parseAreaField(size)
  const summaryParts = [
    PROPERTY_TYPE_LABELS[propertyType],
    location.trim() || null,
    price.trim() ? formatPriceDigits(price) : null,
    parsedArea != null ? formatAreaField(parsedArea) : null,
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
              <p className="text-sm font-semibold text-emerald-900">Seu perfil será vinculado a este anúncio</p>
              <p className="mt-1 text-xs text-emerald-800/80">
                Nome e CRECI vêm do seu cadastro. O WhatsApp pode ser alterado no painel inicial.
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
              O anúncio só aparece no site quando vinculado a um corretor com WhatsApp.
            </p>
          )}
        </section>
      )}

      <section className="space-y-4">
        <CategorySelector value={propertyType} onChange={setPropertyType} />

        {summaryParts.length >= 2 && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-800">Prévia:</span> {summaryParts.join(' · ')}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div id="field-price">
            <Input
              label="Preço"
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div id="field-size">
            <Input
              label="Área total (m²)"
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
          <Input
            label="Frente (m)"
            name="frontage"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex: 12"
            value={frontage}
            onChange={(e) => setFrontage(e.target.value)}
          />
          <Input
            label="Fundo (m)"
            name="depth"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex: 30"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Zoneamento / uso" value={zoning} options={ZONING_OPTIONS} onChange={setZoning} />
          <Select label="Topografia" value={topography} options={TOPOGRAPHY_OPTIONS} onChange={setTopography} />
          <Select
            label="Situação documental"
            value={documentation}
            options={DOCUMENTATION_OPTIONS}
            onChange={setDocumentation}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Infraestrutura e condições</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <CheckboxChip label="Água" checked={hasWater} onChange={setHasWater} />
            <CheckboxChip label="Energia" checked={hasElectricity} onChange={setHasElectricity} />
            <CheckboxChip label="Esgoto" checked={hasSewage} onChange={setHasSewage} />
            <CheckboxChip label="Rua asfaltada" checked={pavedStreet} onChange={setPavedStreet} />
            <CheckboxChip label="Condomínio fechado" checked={gatedCommunity} onChange={setGatedCommunity} />
            <CheckboxChip label="Aceita financiamento" checked={acceptsFinancing} onChange={setAcceptsFinancing} />
          </div>
        </div>

        {(isLote || gatedCommunity) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Loteamento / empreendimento"
              name="development_name"
              placeholder="Ex: Residencial Jardim das Águas"
              value={developmentName}
              onChange={(e) => setDevelopmentName(e.target.value)}
            />
            <Input label="Quadra" name="block" placeholder="Ex: B" value={block} onChange={(e) => setBlock(e.target.value)} />
            <Input
              label="Lote nº"
              name="lot_number"
              placeholder="Ex: 14"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
            />
          </div>
        )}

        <div>
          <Textarea
            label="Descrição"
            name="description"
            placeholder={DESCRIPTION_PLACEHOLDER}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-500">Destaques:</span>
            {LAND_TAGS.map((tag) => (
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
              Ainda sem visitas ou cliques no WhatsApp. Compartilhe o link do anúncio para atrair interessados.
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
                : 'Criar anúncio'}
        </button>
      </div>
    </form>
  )
}
