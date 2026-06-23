import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import { LoginBackdrop } from '../components/brand/LoginBackdrop'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { BRAND } from '../lib/brand'
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
    document.title = `${BRAND.name} — Admin`
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
    <LoginBackdrop>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="flex justify-center">
              <BrandLogo size="lg" variant="light" showTagline />
            </div>
            <p className="mt-5 text-sm text-slate-300">Entrar no painel administrativo</p>
          </div>

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

            <Button type="submit" className="mt-6 w-full !bg-amber-600 hover:!bg-amber-500" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </LoginBackdrop>
  )
}
