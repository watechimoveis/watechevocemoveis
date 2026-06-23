import { apiRequest, setAuth } from './api'
import type { LoginResponse } from '../types/user'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiRequest<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    false,
  )
  setAuth(data.access_token, data.user)
  return data
}

export async function fetchMe() {
  return apiRequest<LoginResponse['user']>('/auth/me')
}

export async function updateMyWhatsApp(whatsapp: string) {
  return apiRequest<LoginResponse['user']>('/auth/me/whatsapp', {
    method: 'PATCH',
    body: JSON.stringify({ whatsapp }),
  })
}
