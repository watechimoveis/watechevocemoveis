import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { createAgent, listAgents, updateAgent } from '../services/agentsService'
import { HttpError } from '../services/api'
import type { AgentPayload } from '../types/user'
import type { User } from '../types/user'
import { formatWhatsAppPhone, getAgentInitials } from '../utils/agent'

type ModalMode = 'create' | 'edit' | null

export function AgentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [agents, setAgents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creci, setCreci] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [isActive, setIsActive] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setAgents(await listAgents())
    } catch {
      setError('Erro ao carregar corretores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      openCreate()
      searchParams.delete('novo')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  function openCreate() {
    setSelected(null)
    setName('')
    setEmail('')
    setPassword('')
    setCreci('')
    setWhatsapp('')
    setIsActive(true)
    setModalMode('create')
  }

  function openEdit(agent: User) {
    setSelected(agent)
    setName(agent.name)
    setEmail(agent.email)
    setPassword('')
    setCreci(agent.creci || '')
    setWhatsapp(agent.whatsapp || '')
    setIsActive(agent.is_active)
    setModalMode('edit')
  }

  function closeModal() {
    if (submitting) return
    setModalMode(null)
    setSelected(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload: AgentPayload = {
        name: name.trim(),
        email: email.trim(),
        creci: creci.trim() || undefined,
        whatsapp: whatsapp.replace(/\D/g, '') || undefined,
        is_active: isActive,
      }

      if (modalMode === 'create') {
        if (!password || password.length < 6) {
          setError('Senha deve ter no mínimo 6 caracteres.')
          return
        }
        await createAgent({ ...payload, password })
        setToast('Corretor cadastrado')
      } else if (selected) {
        await updateAgent(selected.id, {
          ...payload,
          ...(password ? { password } : {}),
        })
        setToast('Corretor atualizado')
      }
      closeModal()
      await load()
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao salvar corretor.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-page-title font-semibold text-slate-900">Corretores</h1>
          <p className="type-page-lead text-slate-500">
            Cadastre corretores com nome, CRECI e WhatsApp. Os dados são vinculados automaticamente aos imóveis.
          </p>
        </div>
        <Button onClick={openCreate}>+ Novo corretor</Button>
      </div>

      {toast && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{toast}</div>
      )}
      {error && !modalMode && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">
            Nenhum corretor cadastrado.
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:grid md:grid-cols-2 md:gap-3 md:divide-y-0 md:p-4 lg:hidden [&>li]:md:overflow-hidden [&>li]:md:rounded-xl [&>li]:md:border [&>li]:md:border-slate-200">
              {agents.map((agent) => (
                <li key={agent.id}>
                  <button
                    type="button"
                    onClick={() => openEdit(agent)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-slate-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {getAgentInitials(agent.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{agent.name}</p>
                      <p className="truncate text-xs text-slate-500">{agent.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {agent.creci && (
                          <span className="text-xs text-slate-600">CRECI {agent.creci}</span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            agent.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {agent.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      {agent.whatsapp && (
                        <p className="mt-1 text-xs text-slate-500">{formatWhatsAppPhone(agent.whatsapp)}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto lg:block">
            <table className="type-table w-full text-left">
              <thead>
                <tr className="type-table-head border-b border-slate-100 bg-slate-50/80 uppercase text-slate-500">
                  <th className="px-4 py-3 font-medium">Corretor</th>
                  <th className="px-4 py-3 font-medium">CRECI</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {getAgentInitials(agent.name)}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{agent.name}</p>
                          <p className="text-xs text-slate-500">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{agent.creci || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatWhatsAppPhone(agent.whatsapp)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          agent.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {agent.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(agent)}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Novo corretor' : 'Editar corretor'}
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && modalMode && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Nome, CRECI e WhatsApp serão usados automaticamente em todos os imóveis cadastrados por este corretor.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="E-mail (login)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              label={modalMode === 'create' ? 'Senha' : 'Nova senha (opcional)'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={modalMode === 'create'}
            />
            <Input label="CRECI" placeholder="Ex: 123456-F" value={creci} onChange={(e) => setCreci(e.target.value)} />
            <Input
              label="WhatsApp"
              placeholder="5511999999999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          {modalMode === 'edit' && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Corretor ativo (pode acessar o painel)
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
