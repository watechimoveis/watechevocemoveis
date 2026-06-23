import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import { LoginBackdrop } from '../components/brand/LoginBackdrop'
import { BRAND } from '../lib/brand'
import { apiUrl } from '../lib/api'

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = `Login corretor — ${BRAND.name}`
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
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
            >
              ← Voltar aos imóveis
            </Link>
            <div className="mt-6 flex justify-center">
              <BrandLogo size="lg" variant="light" showTagline />
            </div>
            <h1 className="mt-5 text-xl font-semibold text-white">Login corretor</h1>
            <p className="mt-1 text-sm text-slate-300">Acesse o painel para cadastrar imóveis</p>
          </div>

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
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? 'Entrando…' : 'Entrar no painel'}
            </button>
          </form>
        </div>
      </main>
    </LoginBackdrop>
  )
}
