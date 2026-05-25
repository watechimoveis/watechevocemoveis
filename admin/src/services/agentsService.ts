import { apiRequest } from './api'
import type { AgentPayload } from '../types/user'
import type { User } from '../types/user'

export async function listAgents(): Promise<User[]> {
  return apiRequest<User[]>('/agents')
}

export async function createAgent(payload: AgentPayload & { password: string }): Promise<User> {
  return apiRequest<User>('/agents', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateAgent(id: string, payload: AgentPayload): Promise<User> {
  return apiRequest<User>(`/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
