// Chain subscription service
// Pluggable to different providers. Starts with no-op stubs so the app runs without credentials.

export interface Subscription {
  id: string
  address: string
  network: string // 'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'solana' | 'bitcoin' | ...
}

export class SubscriptionService {
  private enabled: boolean
  constructor() {
    // Enable only if API keys are present
    this.enabled = Boolean(
      process.env.MORALIS_API_KEY ||
      process.env.ALCHEMY_API_KEY ||
      process.env.HELIUS_API_KEY ||
      process.env.TATUM_API_KEY
    )
  }

  async subscribeAddress(address: string, network: string): Promise<void> {
    if (!this.enabled) {
      // no-op if not configured
      return
    }
    // TODO: plug provider SDKs; for now, log intent
    console.log(`[subscriptions] subscribe ${address} on ${network}`)
  }

  async unsubscribeAddress(address: string, network: string): Promise<void> {
    if (!this.enabled) return
    console.log(`[subscriptions] unsubscribe ${address} on ${network}`)
  }
}

export const subscriptionService = new SubscriptionService()



