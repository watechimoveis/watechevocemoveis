import { useState, type FormEvent } from 'react'
import { HttpError } from '../../services/api'
import { updateMyWhatsApp } from '../../services/authService'
import type { User } from '../../types/user'
import { formatWhatsAppPhone } from '../../utils/agent'
import { Input } from '../ui/Input'

interface AgentWhatsAppEditorProps {
  user: User
  onUpdated: (user: User) => void
}

export function AgentWhatsAppEditor({ user, onUpdated }: AgentWhatsAppEditorProps) {
  const [editing, setEditing] = useState(!user.whatsapp)
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openEditor() {
    setWhatsapp(user.whatsapp || '')
    setError('')
    setEditing(true)
  }

  function cancel() {
    setWhatsapp(user.whatsapp || '')
    setError('')
    setEditing(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await updateMyWhatsApp(whatsapp)
      onUpdated(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao salvar WhatsApp.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div>
        <dt className="text-slate-500">WhatsApp</dt>
        <dd className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-slate-800">
            {user.whatsapp ? formatWhatsAppPhone(user.whatsapp) : 'Não cadastrado'}
          </span>
          <button
            type="button"
            onClick={openEditor}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            {user.whatsapp ? 'Alterar' : 'Cadastrar'}
          </button>
        </dd>
      </div>
    )
  }

  return (
    <div className="sm:col-span-2 lg:col-span-4">
      <form onSubmit={handleSubmit} className="rounded-xl border border-emerald-200 bg-white/80 p-4">
        <p className="text-sm font-semibold text-slate-900">Seu WhatsApp</p>
        <p className="mt-1 text-xs text-slate-500">
          Usado nos botões de contato de todos os seus anúncios. Informe DDD + número (ex: 22999999999).
        </p>
        <div className="mt-3 max-w-md">
          <Input
            label="WhatsApp"
            name="whatsapp"
            inputMode="numeric"
            placeholder="22999999999"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            error={error}
            required
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar WhatsApp'}
          </button>
          {user.whatsapp && (
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
