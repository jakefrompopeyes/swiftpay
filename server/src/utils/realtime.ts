import { wss } from '../index'

export type RealtimeEvent =
  | { type: 'payment_request_updated'; id: string; status: string; txHash?: string }
  | { type: 'transaction_created'; id: string; status: string; txHash?: string }

export function broadcast(event: RealtimeEvent) {
  try {
    const payload = JSON.stringify(event)
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) {
        client.send(payload)
      }
    })
  } catch (e) {
    console.error('Broadcast error:', e)
  }
}



