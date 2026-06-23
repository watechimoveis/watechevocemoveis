import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { mediaUrl } from '../lib/api'
import { PropertyForm } from '../components/properties/PropertyForm'
import { PerformanceBar } from '../components/analytics/PerformanceBar'
import { ListingTypeBadge, PropertyTypeBadge } from '../components/properties/PropertyTypeBadge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import {
  createProperty,
  deleteProperty,
  listProperties,
  updateProperty,
} from '../services/propertiesService'
import type { Property, PropertyPayload, PropertyType } from '../types/property'
import { LISTING_LABELS, PROPERTY_TYPE_LABELS } from '../types/property'
import { formatPrice } from '../utils/format'
import { formatWhatsAppPhone, getAgentInitials } from '../utils/agent'

type ModalMode = 'create' | 'edit' | 'delete' | null

export function PropertiesPage() {
  const { isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Property | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const [createPreset, setCreatePreset] = useState<PropertyType>('land')

  const load = useCallback(async (currentPage = page) => {
    setLoading(true)
    setError('')
    try {
      const data = await listProperties(currentPage)
      setProperties(data.items)
      setTotal(data.total)
      setPage(data.page)
      setPages(data.pages)
      return data.items
    } catch {
      setError('Erro ao carregar imóveis.')
      return []
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load(page)
  }, [page, load])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      setSelected(null)
      setModalMode('create')
      searchParams.delete('novo')
      setSearchParams(searchParams, { replace: true })
      return
    }

    const editId = searchParams.get('editar')
    if (editId) {
      const found = properties.find((p) => p.id === editId)
      if (found) {
        setSelected(found)
        setModalMode('edit')
      } else if (!loading) {
        listProperties(1, 50).then((data) => {
          const property = data.items.find((p) => p.id === editId)
          if (property) {
            setSelected(property)
            setModalMode('edit')
          }
        })
      }
      searchParams.delete('editar')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, properties, loading])

  function openCreate(preset: PropertyType = 'land') {
    setCreatePreset(preset)
    setSelected(null)
    setModalMode('create')
  }

  function openEdit(property: Property) {
    setSelected(property)
    setModalMode('edit')
  }

  function openDelete(property: Property) {
    setSelected(property)
    setModalMode('delete')
  }

  function resetModal() {
    setModalMode(null)
    setSelected(null)
  }

  function closeModal() {
    if (submitting) return
    resetModal()
  }

  async function handleSave(payload: PropertyPayload): Promise<Property | void> {
    setSubmitting(true)
    try {
      if (modalMode === 'edit' && selected) {
        const updated = await updateProperty(selected.id, payload)
        setToast('Anúncio atualizado — já está no site')
        resetModal()
        await load(page)
        return updated
      }
      const created = await createProperty(payload)
      setSelected(created)
      setModalMode('edit')
      await load(page)
      return created
    } catch {
      setError('Erro ao salvar anúncio.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleFormSuccess({ photosUploaded, isNew }: { property: Property; photosUploaded: number; isNew: boolean }) {
    if (!isNew) return
    if (photosUploaded > 0) {
      setToast(`Anúncio publicado no site com ${photosUploaded} foto(s)`)
    } else {
      setToast('Anúncio criado — adicione fotos para destacar no site')
    }
  }

  async function handleDelete() {
    if (!selected) return
    setSubmitting(true)
    try {
      await deleteProperty(selected.id)
      setToast('Anúncio removido do site')
      resetModal()
      const nextPage = properties.length === 1 && page > 1 ? page - 1 : page
      setPage(nextPage)
      await load(nextPage)
    } catch {
      setError('Erro ao remover anúncio.')
    } finally {
      setSubmitting(false)
    }
  }

  const pageViews7d = properties.reduce((sum, p) => sum + (p.stats?.views_7d ?? 0), 0)
  const pageWhatsApp7d = properties.reduce((sum, p) => sum + (p.stats?.whatsapp_clicks_7d ?? 0), 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-page-title font-semibold text-slate-900">
            {isAdmin ? 'Todos os imóveis' : 'Meus anúncios'}
          </h1>
          <p className="type-page-lead text-slate-500">
            {total} {total === 1 ? 'anúncio' : 'anúncios'}
            {!isAdmin && ' · publicados no site com seu perfil'}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {(['land', 'house', 'apartment'] as PropertyType[]).map((type) => (
            <Button
              key={type}
              variant={type === 'land' ? 'primary' : 'secondary'}
              className="w-full sm:w-auto"
              onClick={() => openCreate(type)}
            >
              + {PROPERTY_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800" role="status">
          {toast}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => load(page)} className="font-medium underline">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-slate-500">
              {isAdmin ? 'Nenhum imóvel cadastrado.' : 'Você ainda não publicou nenhum anúncio.'}
            </p>
            <Button className="mt-4" onClick={() => openCreate()}>
              {isAdmin ? 'Cadastrar imóvel' : 'Publicar primeiro anúncio'}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 xl:px-5">
              <p className="type-meta font-medium text-slate-600">
                {properties.length} {properties.length === 1 ? 'anúncio nesta página' : 'anúncios nesta página'}
              </p>
              <div className="flex flex-wrap items-center gap-2 type-meta text-slate-500">
                <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200/80">
                  <span className="font-semibold text-blue-700 tabular-nums">{pageViews7d}</span> views (7d)
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200/80">
                  <span className="font-semibold text-emerald-700 tabular-nums">{pageWhatsApp7d}</span> WhatsApp (7d)
                </span>
              </div>
            </div>

            {/* Cards — celular e tablet */}
            <ul className="divide-y divide-slate-100 md:grid md:grid-cols-2 md:gap-4 md:divide-y-0 md:p-4 lg:hidden [&>li]:md:overflow-hidden [&>li]:md:rounded-xl [&>li]:md:border [&>li]:md:border-slate-200 [&>li]:md:bg-white [&>li]:md:shadow-sm">
              {properties.map((property) => (
                <PropertyMobileCard
                  key={property.id}
                  property={property}
                  isAdmin={isAdmin}
                  onEdit={() => openEdit(property)}
                  onDelete={() => openDelete(property)}
                />
              ))}
            </ul>

            {/* Tabela — desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="type-table w-full text-left">
                <thead>
                  <tr className="type-table-head border-b border-slate-100 bg-white uppercase text-slate-500">
                    <th className="min-w-[22rem] px-5 py-3.5 font-medium xl:px-6 xl:py-4">Anúncio</th>
                    <th className="px-5 py-3.5 font-medium xl:px-6 xl:py-4">Preço</th>
                    <th className="min-w-[12rem] px-5 py-3.5 font-medium xl:px-6 xl:py-4">Performance (7d)</th>
                    {isAdmin && <th className="min-w-[10rem] px-5 py-3.5 font-medium xl:px-6 xl:py-4">Responsável</th>}
                    <th className="w-36 px-5 py-3.5 text-right font-medium xl:px-6 xl:py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {properties.map((property) => (
                    <tr
                      key={property.id}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                      onClick={() => openEdit(property)}
                    >
                      <td className="px-5 py-4 xl:px-6">
                        <PropertyListingCell property={property} />
                      </td>
                      <td className="px-5 py-4 align-top xl:px-6">
                        <p className="font-semibold tabular-nums text-slate-900">
                          {formatPrice(property.price)}
                        </p>
                        {property.listing_type === 'rent' && (
                          <p className="type-meta text-slate-500">por mês</p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top xl:px-6">
                        <PerformanceBar stats={property.stats} variant="inline" />
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4 align-top xl:px-6">
                          {property.agent_name ? (
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                {getAgentInitials(property.agent_name)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-800">{property.agent_name}</p>
                                <p className="truncate type-meta text-slate-500">
                                  {formatWhatsAppPhone(property.agent_whatsapp)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-4 text-right align-top xl:px-6">
                        <PropertyRowActions
                          onEdit={() => openEdit(property)}
                          onDelete={() => openDelete(property)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Página {page} de {pages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={
          modalMode === 'edit' && selected
            ? `Editar · ${PROPERTY_TYPE_LABELS[selected.property_type] || 'Imóvel'}`
            : `Novo · ${PROPERTY_TYPE_LABELS[createPreset]}`
        }
        wide
      >
        <PropertyForm
          property={selected}
          defaultPropertyType={modalMode === 'create' ? createPreset : undefined}
          onSubmit={handleSave}
          onCancel={closeModal}
          onPropertyChange={setSelected}
          onSuccess={handleFormSuccess}
          loading={submitting}
        />
      </Modal>

      <Modal
        open={modalMode === 'delete'}
        onClose={closeModal}
        title="Excluir anúncio"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Excluindo…' : 'Excluir'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Remover <strong>{selected?.title || 'este anúncio'}</strong> do site? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  )
}

function PropertyListingCell({ property }: { property: Property }) {
  const hasPhotos = Boolean(property.images?.length)

  return (
    <div className="flex items-start gap-4">
      <div className="relative shrink-0">
        {property.images?.[0] ? (
          <img
            src={mediaUrl(property.images[0].url)}
            alt=""
            className="h-[4.5rem] w-[5.75rem] rounded-xl object-cover ring-1 ring-slate-200/80 xl:h-20 xl:w-[6.25rem]"
          />
        ) : (
          <div className="flex h-[4.5rem] w-[5.75rem] flex-col items-center justify-center rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200/80 xl:h-20 xl:w-[6.25rem]">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm4.026 2.475a.75.75 0 0 0-1.052.086l-2.5 3a.75.75 0 0 0 .902 1.18l1.273-.848 1.046 1.394a.75.75 0 0 0 1.213-.085l2.25-3.75 1.046 1.394a.75.75 0 0 0 1.213-.085l1.5-2.5a.75.75 0 0 0-.64-1.122H5.026Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="mt-1 text-[0.625rem] font-medium">Sem foto</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-semibold text-slate-900">
            {property.title || <span className="italic font-normal text-slate-400">Sem título</span>}
          </p>
          <PropertyTypeBadge type={property.property_type} />
          <ListingTypeBadge type={property.listing_type} />
        </div>
        {property.location && (
          <p className="mt-1 truncate type-meta text-slate-500">{property.location}</p>
        )}
        {!hasPhotos && (
          <p className="mt-1 type-meta font-medium text-amber-700">Adicione fotos para destacar no site</p>
        )}
      </div>
    </div>
  )
}

function PropertyRowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onEdit}
        className="px-3 py-1.5 type-meta font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Editar
      </button>
      <span className="w-px self-stretch bg-slate-200" aria-hidden="true" />
      <button
        type="button"
        onClick={onDelete}
        className="px-3 py-1.5 type-meta font-medium text-red-600 transition hover:bg-red-50"
      >
        Excluir
      </button>
    </div>
  )
}

function PropertyMobileCard({
  property,
  isAdmin,
  onEdit,
  onDelete,
}: {
  property: Property
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full gap-3 px-4 py-4 text-left transition active:bg-slate-50"
      >
        {property.images?.[0] ? (
          <img
            src={mediaUrl(property.images[0].url)}
            alt=""
            className="h-20 w-24 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/80"
          />
        ) : (
          <div className="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200/80">
            <span className="text-xs font-medium">Sem foto</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold text-slate-900">
              {property.title || <span className="italic font-normal text-slate-400">Sem título</span>}
            </p>
            <PropertyTypeBadge type={property.property_type} />
          </div>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {formatPrice(property.price)}
            {property.listing_type === 'rent' && (
              <span className="text-xs font-normal text-slate-500"> /mês</span>
            )}
          </p>
          <p className="mt-0.5 truncate type-meta text-slate-500">
            {LISTING_LABELS[property.listing_type]}
            {property.location ? ` · ${property.location}` : ''}
          </p>
          <div className="mt-2.5">
            <PerformanceBar stats={property.stats} variant="inline" />
          </div>
          {isAdmin && property.agent_name && (
            <p className="mt-2 truncate type-meta text-slate-400">{property.agent_name}</p>
          )}
        </div>
      </button>
      <div className="flex gap-2 border-t border-slate-100 px-4 pb-3 pt-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onEdit}>
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onDelete}
        >
          Excluir
        </Button>
      </div>
    </li>
  )
}
