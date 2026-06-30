import { useEffect, useState, type FormEvent } from 'react'
import { LoginBackdrop } from '../components/brand/LoginBackdrop'
import { LoginShell } from '../components/brand/LoginShell'
import { BRAND } from '../lib/brand'
import { apiUrl } from '../lib/api'

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173'
const REMEMBER_LOGIN_KEY = 'sysestate_remember_login'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = `Login corretor — ${BRAND.name}`
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch(apiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'E-mail ou senha incorretos')
        return
      }

      if (remember) {
        localStorage.setItem(
          REMEMBER_LOGIN_KEY,
          JSON.stringify({ email, password, remember: true }),
        )
      } else {
        localStorage.removeItem(REMEMBER_LOGIN_KEY)
      }

      const params = new URLSearchParams({
        token: data.access_token,
        user: JSON.stringify(data.user),
      })
      window.location.href = `${ADMIN_URL}/login?${params.toString()}`
    } catch {
      setError('Não foi possível conectar. Verifique se a API está rodando.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginBackdrop>
      <LoginShell
        title="Login corretor"
        subtitle="Acesse o painel para publicar terrenos e imóveis com seu perfil profissional."
      >
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-11 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar no painel'}
          </button>
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
