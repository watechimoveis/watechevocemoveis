export interface User {
  id: string
  email: string
  name: string
  creci: string | null
  whatsapp: string | null
  role: 'admin' | 'agent'
  is_active: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface AgentPayload {
  email: string
  password?: string
  name: string
  creci?: string
  whatsapp?: string
  is_active?: boolean
}
