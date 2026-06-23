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
            {loading ? 'Entrando…' : 'Entrar no painel'}
          </Button>
        </form>
      </LoginShell>
    </LoginBackdrop>
  )
}
