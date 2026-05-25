import { getSessionHash } from '../utils/analytics'

export type PropertyEventType = 'view' | 'whatsapp_click'

export async function recordPropertyEvent(
  propertyId: string,
  eventType: PropertyEventType,
): Promise<void> {
  try {
    await fetch(`/api/v1/properties/${propertyId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        session_hash: getSessionHash(),
      }),
    })
  } catch {
    /* analytics must not block UX */
  }
}
