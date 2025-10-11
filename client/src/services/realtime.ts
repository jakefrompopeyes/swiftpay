export type ServerEvent =
  | { type: 'payment_request_updated'; id: string; status: string; txHash?: string }
  | { type: 'transaction_created'; id: string; status: string; txHash?: string }

type Callback = (event: ServerEvent) => void

class RealtimeService {
  private socket: WebSocket | null = null
  private listeners: Set<Callback> = new Set()

  connect(baseUrl: string = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001')) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return
    const wsUrl = baseUrl.replace('http', 'ws')
    this.socket = new WebSocket(wsUrl)

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.listeners.forEach((cb) => cb(data))
      } catch {}
    }
  }

  on(cb: Callback) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }
}

export const realtime = new RealtimeService()



