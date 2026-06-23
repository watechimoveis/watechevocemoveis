import { useEffect, useState, type FormEvent } from 'react'
import { HttpError } from '../../services/api'
import { updateMyWhatsApp } from '../../services/authService'
import type { User } from '../../types/user'
import { formatWhatsAppPhone } from '../../utils/agent'
import {
  buildWhatsAppTestUrl,
  formatDddDisplay,
  formatMobileDisplay,
  normalizeWhatsAppStorage,
  parseStoredWhatsApp,
  validateWhatsAppFields,
} from '../../utils/phone'

interface AgentWhatsAppEditorProps {
  user: User
  onUpdated: (user: User) => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function AgentWhatsAppEditor({ user, onUpdated }: AgentWhatsAppEditorProps) {
  const parsed = parseStoredWhatsApp(user.whatsapp)
  const [editing, setEditing] = useState(!user.whatsapp)
  const [ddd, setDdd] = useState(parsed.ddd)
  const [number, setNumber] = useState(parsed.number)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    const next = parseStoredWhatsApp(user.whatsapp)
    setDdd(next.ddd)
    setNumber(next.number)
  }, [user.whatsapp])

  useEffect(() => {
    if (status !== 'saved') return
    const timer = setTimeout(() => setStatus('idle'), 4000)
    return () => clearTimeout(timer)
  }, [status])

  function openEditor() {
    const next = parseStoredWhatsApp(user.whatsapp)
    setDdd(next.ddd)
    setNumber(next.number)
    setError('')
    setSavedMessage('')
    setStatus('idle')
    setEditing(true)
  }

  function cancel() {
    const next = parseStoredWhatsApp(user.whatsapp)
    setDdd(next.ddd)
    setNumber(next.number)
    setError('')
    setStatus('idle')
    if (user.whatsapp) setEditing(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validateWhatsAppFields(ddd, number)
    if (validationError) {
      setError(validationError)
      setStatus('error')
      return
    }

    const normalized = normalizeWhatsAppStorage(ddd, number)
    if (!normalized) {
      setError('WhatsApp inválido. Confira DDD e número.')
      setStatus('error')
      return
    }

    setStatus('saving')
    setError('')
    setSavedMessage('')

    try {
      const updated = await updateMyWhatsApp(normalized)
      onUpdated(updated)
      setStatus('saved')
      setSavedMessage('WhatsApp salvo! Os botões dos seus anúncios já apontam para este número.')
      setEditing(false)
    } catch (err) {
      setStatus('error')
      setError(err instanceof HttpError ? err.message : 'Erro ao salvar WhatsApp.')
    }
  }

  const testUrl = buildWhatsAppTestUrl(user.whatsapp)
  const isSaving = status === 'saving'

  if (!editing) {
    return (
      <div>
        <dt className="text-slate-500">WhatsApp</dt>
        <dd className="mt-0.5 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-slate-800">
              {user.whatsapp ? formatWhatsAppPhone(user.whatsapp) : 'Não cadastrado'}
            </span>
            {status === 'saved' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <CheckIcon />
                Salvo
              </span>
            )}
            <button
              type="button"
              onClick={openEditor}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              {user.whatsapp ? 'Alterar' : 'Cadastrar'}
            </button>
          </div>

          {status === 'saved' && savedMessage && (
            <p className="text-xs font-medium text-emerald-700" role="status" aria-live="polite">
              {savedMessage}
            </p>
          )}

          {user.whatsapp && (
            <p className="text-[11px] text-slate-500">
              Clientes que clicarem em WhatsApp nos seus imóveis falam direto com você.
              {testUrl && (
                <>
                  {' '}
                  <a
                    href={testUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    Testar link
                  </a>
                </>
              )}
            </p>
          )}
        </dd>
      </div>
    )
  }

  return (
    <div className="sm:col-span-2 lg:col-span-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-emerald-200 bg-white/80 p-4"
        aria-busy={isSaving}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Seu WhatsApp</p>
            <p className="mt-1 text-xs text-slate-500">
              Este número aparece nos botões de contato de todos os seus anúncios no site.
            </p>
          </div>
          {isSaving && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <SpinnerIcon />
              Salvando…
            </span>
          )}
        </div>

        <div className="mt-4 max-w-lg">
          <p className="mb-2 text-sm font-medium text-slate-700">Telefone com DDD</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex items-center gap-1.5">
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-medium text-slate-500">
                +55
              </span>
              <label className="sr-only" htmlFor="whatsapp-ddd">
                DDD
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  (
                </span>
                <input
                  id="whatsapp-ddd"
                  name="ddd"
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel-area-code"
                  placeholder="22"
                  maxLength={2}
                  value={ddd}
                  disabled={isSaving}
                  onChange={(e) => {
                    setDdd(formatDddDisplay(e.target.value))
                    setError('')
                    setStatus('idle')
                  }}
                  className={`w-16 rounded-lg border bg-white py-2 pl-5 pr-2 text-center text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${error ? 'border-red-400' : 'border-slate-200'}`}
                />
                <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  )
                </span>
              </div>
            </div>

            <div className="min-w-[10rem] flex-1">
              <label className="sr-only" htmlFor="whatsapp-number">
                Número
              </label>
              <input
                id="whatsapp-number"
                name="number"
                type="text"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="99728-2231"
                value={formatMobileDisplay(number)}
                disabled={isSaving}
                onChange={(e) => {
                  setNumber(formatMobileDisplay(e.target.value))
                  setError('')
                  setStatus('idle')
                }}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 ${error ? 'border-red-400' : 'border-slate-200'}`}
              />
            </div>
          </div>

          {error ? (
            <p className="mt-2 text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Exemplo: (22) 99728-2231</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <SpinnerIcon className="text-white" />
                Salvando…
              </>
            ) : (
              'Salvar WhatsApp'
            )}
          </button>
          {user.whatsapp && (
            <button
              type="button"
              onClick={cancel}
              disabled={isSaving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-3.5 w-3.5 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
