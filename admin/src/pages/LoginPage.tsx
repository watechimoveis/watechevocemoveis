import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import sysestateBg from '../assets/sysestate.png'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { HttpError } from '../services/api'
import type { User } from '../types/user'

export function LoginPage() {
  const { login, establishSession } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('teste@watechimoveis.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Entrar — SysEstate'
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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 safe-top safe-bottom">
      <img
        src={sysestateBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/70 to-slate-950/90"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.12),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">SysEstate</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Painel administrativo</h1>
          <p className="mt-2 text-sm text-slate-300">
            Gestão inteligente de terrenos, vendas e aluguéis
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur-md sm:p-8"
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
            <Input
              label="Senha"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 md:text-left">
          Acesso exclusivo para corretores e administradores
        </p>
      </div>
    </div>
  )
}
