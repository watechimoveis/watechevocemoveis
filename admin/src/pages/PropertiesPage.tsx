import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { mediaUrl } from '../lib/api'
import { PropertyForm } from '../components/properties/PropertyForm'
import { PerformanceBar } from '../components/analytics/PerformanceBar'
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
import { PROPERTY_TYPE_LABELS } from '../types/property'
import { formatPrice } from '../utils/format'
import { formatWhatsAppPhone, getAgentInitials } from '../utils/agent'

type ModalMode = 'create' | 'edit' | 'delete' | null

const LISTING_LABEL: Record<string, string> = { sale: 'Venda', rent: 'Aluguel' }

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
            {/* Cards — celular e tablet */}
            <ul className="divide-y divide-slate-100 md:grid md:grid-cols-2 md:gap-3 md:divide-y-0 md:p-4 lg:hidden [&>li]:md:overflow-hidden [&>li]:md:rounded-xl [&>li]:md:border [&>li]:md:border-slate-200">
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
                <tr className="type-table-head border-b border-slate-100 bg-slate-50/80 uppercase text-slate-500">
                  <th className="w-14 px-4 py-3 font-medium xl:px-5 xl:py-4" />
                  <th className="px-4 py-3 font-medium xl:px-5 xl:py-4">Anúncio</th>
                  <th className="px-4 py-3 font-medium xl:px-5 xl:py-4">Preço</th>
                  <th className="px-4 py-3 font-medium xl:px-5 xl:py-4">Performance (7d)</th>
                  {isAdmin && <th className="px-4 py-3 font-medium xl:px-5 xl:py-4">Responsável</th>}
                  <th className="px-4 py-3 text-right font-medium xl:px-5 xl:py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((property) => (
                  <tr
                    key={property.id}
                    className="group cursor-pointer hover:bg-slate-50/80"
                    onClick={() => openEdit(property)}
                  >
                    <td className="px-4 py-3 xl:px-5 xl:py-4">
                      {property.images?.[0] ? (
                        <img
                          src={mediaUrl(property.images[0].url)}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover xl:h-12 xl:w-12"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 xl:px-5 xl:py-4">
                      <p className="font-medium text-slate-900">
                        {property.title || <span className="italic text-slate-400">Sem título</span>}
                      </p>
                      <p className="type-meta text-slate-500">
                        {PROPERTY_TYPE_LABELS[property.property_type] || 'Imóvel'}
                        {' · '}
                        {LISTING_LABEL[property.listing_type] || 'Venda'}
                        {property.location ? ` · ${property.location}` : ''}
                        {!property.images?.length && (
                          <span className="ml-1 font-medium text-amber-600">· Sem fotos</span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 xl:px-5 xl:py-4">
                      {formatPrice(property.price)}
                      {property.listing_type === 'rent' && (
                        <span className="type-meta font-normal text-slate-500">/mês</span>
                      )}
                    </td>
                    <td className="px-4 py-3 xl:px-5 xl:py-4">
                      <PerformanceBar stats={property.stats} compact />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 xl:px-5 xl:py-4">
                        {property.agent_name ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[0.65rem] font-semibold text-blue-700 xl:h-8 xl:w-8 xl:text-xs">
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
                    <td className="px-4 py-3 text-right xl:px-5 xl:py-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(property)
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDelete(property)
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
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
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            —
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">
            {property.title || <span className="italic text-slate-400">Sem título</span>}
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-800">
            {formatPrice(property.price)}
            {property.listing_type === 'rent' && (
              <span className="text-xs font-normal text-slate-500">/mês</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {PROPERTY_TYPE_LABELS[property.property_type] || 'Imóvel'}
            {' · '}
            {LISTING_LABEL[property.listing_type] || 'Venda'}
            {property.location ? ` · ${property.location}` : ''}
            {!property.images?.length && (
              <span className="font-medium text-amber-600"> · Sem fotos</span>
            )}
          </p>
          <div className="mt-2">
            <PerformanceBar stats={property.stats} compact />
          </div>
          {isAdmin && property.agent_name && (
            <p className="mt-1 truncate text-xs text-slate-400">{property.agent_name}</p>
          )}
        </div>
      </button>
      <div className="flex gap-2 border-t border-slate-50 px-4 pb-3">
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
