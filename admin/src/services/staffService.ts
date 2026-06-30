import { apiRequest } from './api'
import type { StaffPayload } from '../types/user'
import type { User } from '../types/user'

export async function listStaff(): Promise<User[]> {
  return apiRequest<User[]>('/staff')
}

export async function createStaff(payload: StaffPayload & { password: string; role: 'agent' | 'financial' }): Promise<User> {
  return apiRequest<User>('/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateStaff(id: string, payload: StaffPayload): Promise<User> {
  return apiRequest<User>(`/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
