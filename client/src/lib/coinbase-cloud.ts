// Coinbase Developer Platform (CDP) integration for Vercel Functions
// Using the working CDP bridge from server-side code

// Dynamic import of CDP bridge
async function getCDPBridge() {
  try {
    const bridge = await import('./cdp-bridge.mjs');
    return bridge;
  } catch (error) {
    console.error('Failed to import CDP bridge:', error);
    throw new Error('CDP bridge not available');
  }
}

export interface WalletResult {
  walletId: string;
  address: string;
  network: string;
  currency: string;
  balance?: string;
}

export interface TransactionResult {
  txHash: string;
  success: boolean;
  explorerUrl?: string;
}

class CoinbaseCloudService {
  /**
   * Create a new wallet using Coinbase Cloud Server Wallets v2
   */
  async createWallet(network: string = 'ethereum'): Promise<WalletResult> {
    try {
      switch (network) {
        case 'solana':
          return await this.createSolanaWallet();
        case 'bitcoin':
          return await this.createBitcoinWallet();
        case 'tron':
          return await this.createTronWallet();
        case 'binance':
          return await this.createBSCWallet();
        default:
          return await this.createEVMWallet(network);
      }
    } catch (error: any) {
      console.error('Failed to create Coinbase Cloud wallet:', error);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Create EVM wallet (Ethereum, Polygon, Base, Arbitrum, BSC)
   */
  async createEVMWallet(network: string = 'ethereum'): Promise<WalletResult> {
    try {
      const bridge = await getCDPBridge();
      
      // Create a new EVM account using Coinbase CDP
      const result = await bridge.createEVMWallet(network);
      
      return {
        walletId: result.walletId,
        address: result.address,
        network: result.network,
        currency: result.currency,
        balance: '0.0000'
      };
    } catch (error: any) {
      console.error(`Failed to create EVM wallet for ${network}:`, error);
      throw new Error(`Failed to create ${network} wallet: ${error.message}`);
    }
  }

  /**
   * Create Solana wallet
   */
  async createSolanaWallet(): Promise<WalletResult> {
    try {
      const bridge = await getCDPBridge();
      
      // Create a new Solana account using Coinbase CDP
      const result = await bridge.createSolanaWallet();
      
      return {
        walletId: result.walletId,
        address: result.address,
        network: result.network,
        currency: result.currency,
        balance: '0.0000'
      };
    } catch (error: any) {
      console.error('Failed to create Solana wallet:', error);
      throw new Error(`Failed to create Solana wallet: ${error.message}`);
    }
  }

  /**
   * Create Bitcoin wallet
   */
  async createBitcoinWallet(): Promise<WalletResult> {
    try {
      const bridge = await getCDPBridge();
      
      // Create a new Bitcoin account using Coinbase CDP
      const result = await bridge.createBitcoinWallet();
      
      return {
        walletId: result.walletId,
        address: result.address,
        network: result.network,
        currency: result.currency,
        balance: '0.00000000'
      };
    } catch (error: any) {
      console.error('Failed to create Bitcoin wallet:', error);
      throw new Error(`Failed to create Bitcoin wallet: ${error.message}`);
    }
  }

  /**
   * Create TRON wallet
   */
  async createTronWallet(): Promise<WalletResult> {
    try {
      const bridge = await getCDPBridge();
      
      // Create a new TRON account using Coinbase CDP
      const result = await bridge.createTronWallet();
      
      return {
        walletId: result.walletId,
        address: result.address,
        network: result.network,
        currency: result.currency,
        balance: '0.0000'
      };
    } catch (error: any) {
      console.error('Failed to create TRON wallet:', error);
      throw new Error(`Failed to create TRON wallet: ${error.message}`);
    }
  }

  /**
   * Create BSC wallet
   */
  async createBSCWallet(): Promise<WalletResult> {
    try {
      const bridge = await getCDPBridge();
      
      // Create a new BSC account using Coinbase CDP
      const result = await bridge.createBSCWallet();
      
      return {
        walletId: result.walletId,
        address: result.address,
        network: 'binance',
        currency: result.currency,
        balance: '0.0000'
      };
    } catch (error: any) {
      console.error('Failed to create BSC wallet:', error);
      throw new Error(`Failed to create BSC wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string, network: string): Promise<string> {
    try {
      const bridge = await getCDPBridge();
      return await bridge.getWalletBalance(address, network);
    } catch (error: any) {
      console.error(`Failed to get balance for ${address} on ${network}:`, error);
      return '0.0000';
    }
  }

  /**
   * Request faucet funds for testing
   */
  async requestFaucet(address: string, network: string, token: string = 'eth'): Promise<any> {
    try {
      const bridge = await getCDPBridge();
      return await bridge.requestFaucet(address, network, token);
    } catch (error: any) {
      console.error('Failed to request faucet:', error);
      throw new Error(`Failed to request faucet: ${error.message}`);
    }
  }

  /**
   * Map network names to CDP network identifiers
   */
  private mapNetworkToCDPNetwork(network: string): string {
    const networkMap: { [key: string]: string } = {
      'ethereum': 'ethereum',
      'polygon': 'polygon',
      'base': 'base',
      'arbitrum': 'arbitrum',
      'binance': 'bsc',
      'bsc': 'bsc'
    };
    return networkMap[network] || 'ethereum';
  }

  /**
   * Get currency for network
   */
  private getCurrencyForNetwork(network: string): string {
    const currencyMap: { [key: string]: string } = {
      'ethereum': 'ETH',
      'polygon': 'MATIC',
      'base': 'ETH',
      'arbitrum': 'ETH',
      'binance': 'BNB',
      'bsc': 'BNB',
      'solana': 'SOL',
      'bitcoin': 'BTC',
      'tron': 'TRX'
    };
    return currencyMap[network] || 'ETH';
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): Array<{network: string, name: string, currency: string}> {
    return [
      { network: 'bitcoin', name: 'Bitcoin', currency: 'BTC' },
      { network: 'ethereum', name: 'Ethereum', currency: 'ETH' },
      { network: 'solana', name: 'Solana', currency: 'SOL' },
      { network: 'tron', name: 'TRON', currency: 'TRX' },
      { network: 'binance', name: 'BNB Smart Chain', currency: 'BNB' }
    ];
  }
}

// Export singleton instance
export const coinbaseCloudService = new CoinbaseCloudService();
