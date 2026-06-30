export type UserRole = 'admin' | 'agent' | 'financial'

export interface User {
  id: string
  email: string
  name: string
  creci: string | null
  whatsapp: string | null
  role: UserRole
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

export interface StaffPayload extends AgentPayload {
  role?: 'agent' | 'financial'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  agent: 'Corretor',
  financial: 'Financeiro',
}
