import { apiUrl } from '../lib/api'
import type { ApiError } from '../types/property'
import type { User } from '../types/user'

const TOKEN_KEY = 'watech_token'
const USER_KEY = 'watech_user'

export class HttpError extends Error {
  code: string
  status: number

  constructor(status: number, body: ApiError) {
    super(body.message)
    this.code = body.code
    this.status = status
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (auth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(apiUrl(`/api/v1${path}`), {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearAuth()
      window.location.href = '/login'
    }
    throw new HttpError(response.status, data as ApiError)
  }

  return data as T
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers()
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(apiUrl(`/api/v1${path}`), {
    method: 'POST',
    headers,
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    throw new HttpError(response.status, data as ApiError)
  }

  return data as T
}
