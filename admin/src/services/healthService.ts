import { apiUrl } from '../lib/api'

export interface ApiHealth {
  status: string
  storage: 'local' | 'supabase'
  photos?: string
  hint?: string
}

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await fetch(apiUrl('/health'))
  if (!response.ok) throw new Error('API indisponível')
  return response.json() as Promise<ApiHealth>
}

export function isPhotoStorageReady(health: ApiHealth | null): boolean {
  return health?.storage === 'supabase'
}
