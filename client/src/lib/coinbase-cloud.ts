// Coinbase Cloud CDP integration for Vercel Functions
import { CdpClient } from '@coinbase/cdp-sdk';

// Initialize CDP client
const cdp = new CdpClient();

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
      const result = await cdp.evm.createWallet({
        network: this.mapNetworkToCDPNetwork(network)
      });

      return {
        walletId: result.walletId,
        address: result.address,
        network,
        currency: this.getCurrencyForNetwork(network),
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
      const result = await cdp.solana.createWallet();

      return {
        walletId: result.walletId,
        address: result.address,
        network: 'solana',
        currency: 'SOL',
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
      const result = await cdp.bitcoin.createWallet();

      return {
        walletId: result.walletId,
        address: result.address,
        network: 'bitcoin',
        currency: 'BTC',
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
      const result = await cdp.tron.createWallet();

      return {
        walletId: result.walletId,
        address: result.address,
        network: 'tron',
        currency: 'TRX',
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
      const result = await cdp.evm.createWallet({
        network: 'bsc'
      });

      return {
        walletId: result.walletId,
        address: result.address,
        network: 'binance',
        currency: 'BNB',
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
      if (network === 'solana') {
        const result = await cdp.solana.getBalance({ address });
        return result.balance || '0.0000';
      } else if (network === 'bitcoin') {
        const result = await cdp.bitcoin.getBalance({ address });
        return result.balance || '0.00000000';
      } else {
        const result = await cdp.evm.getBalance({ 
          address, 
          network: this.mapNetworkToCDPNetwork(network) 
        });
        return result.balance || '0.0000';
      }
    } catch (error: any) {
      console.error(`Failed to get balance for ${address} on ${network}:`, error);
      return '0.0000';
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
