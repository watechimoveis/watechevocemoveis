import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoginBackdrop } from '../components/brand/LoginBackdrop'
import { LoginShell } from '../components/brand/LoginShell'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { BRAND } from '../lib/brand'
import { HttpError } from '../services/api'
import type { User } from '../types/user'

const REMEMBER_LOGIN_KEY = 'sysestate_remember_login'

export function LoginPage() {
  const { login, establishSession } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = `${BRAND.name} — Admin`
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_LOGIN_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { email?: string; password?: string; remember?: boolean }
      if (saved.remember) {
        setEmail(saved.email ?? '')
        setPassword(saved.password ?? '')
        setRemember(true)
      }
    } catch {
      localStorage.removeItem(REMEMBER_LOGIN_KEY)
    }
  }, [])

  useEffect(() => {
    const token = searchParams.get('token')
    const userRaw = searchParams.get('user')
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as User
        establishSession(token, user)
        navigate('/', { replace: true })
      } catch {
        /* ignore malformed handoff */
      }
    }
  }, [searchParams, navigate, establishSession])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      if (remember) {
        localStorage.setItem(
          REMEMBER_LOGIN_KEY,
          JSON.stringify({ email, password, remember: true }),
        )
      } else {
        localStorage.removeItem(REMEMBER_LOGIN_KEY)
      }
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message)
      } else {
        setError('Não foi possível entrar. Verifique se a API está rodando.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginBackdrop>
      <LoginShell
        title="Área do corretor"
        subtitle="Entre para cadastrar terrenos, acompanhar leads e gerenciar seus anúncios."
      >
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 xl:text-base">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-11 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 xl:px-3.5 xl:py-2.5 xl:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
              />
              Salvar e-mail e senha neste dispositivo
            </label>
          </div>

          <Button type="submit" className="mt-6 w-full !bg-amber-600 hover:!bg-amber-500" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar no painel'}
          </Button>
        </form>
      </LoginShell>
    </LoginBackdrop>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.245 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  )
}
