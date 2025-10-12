// CommonJS service that uses the ES module bridge

interface WalletResult {
  walletId: string;
  address: string;
  network: string;
  currency: string;
}

interface TransactionResult {
  txHash: string;
  status: string;
  success?: boolean;
  explorerUrl?: string;
}

class CoinbaseCloudService {
  /**
   * Create a new wallet using Coinbase Cloud Server Wallets v2
   */
  async createWallet(userId: string, network: string = 'ethereum'): Promise<WalletResult> {
    try {
      // Use eval to prevent TypeScript from transpiling the dynamic import
      const bridgePath = '../../cdp-bridge.mjs';
      const bridge = await eval(`import('${bridgePath}')`) as any;
      
      switch (network) {
        case 'solana':
          return await bridge.createSolanaWallet();
        case 'bitcoin':
          return await bridge.createBitcoinWallet();
        case 'tron':
          return await bridge.createTronWallet();
        case 'bsc':
          return await bridge.createBSCWallet();
        default:
          return await bridge.createEVMWallet(network);
      }
    } catch (error: any) {
      console.error('Failed to create Coinbase Cloud wallet:', error);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Create all auto-create wallets for a new user
   */
  async createAutoWallets(userId: string): Promise<WalletResult[]> {
    try {
      const bridgePath = '../../cdp-bridge.mjs';
      const bridge = await eval(`import('${bridgePath}')`) as any;
      
      const autoCreateNetworks = bridge.getAutoCreateNetworks();
      const wallets: WalletResult[] = [];
      
      for (const network of autoCreateNetworks) {
        try {
          let wallet: WalletResult;
          
          switch (network.network) {
            case 'ethereum':
              wallet = await bridge.createEVMWallet('ethereum');
              break;
            case 'bitcoin':
              wallet = await bridge.createBitcoinWallet();
              break;
            case 'solana':
              wallet = await bridge.createSolanaWallet();
              break;
            case 'tron':
              wallet = await bridge.createTronWallet();
              break;
            case 'bsc':
              wallet = await bridge.createBSCWallet();
              break;
            default:
              wallet = await bridge.createEVMWallet(network.network);
          }
          
          wallets.push(wallet);
          console.log(`✅ Auto-created ${network.name} wallet for user ${userId}`);
        } catch (error: any) {
          console.error(`❌ Failed to create ${network.name} wallet:`, error.message);
          // Continue with other wallets even if one fails
        }
      }
      
      return wallets;
    } catch (error: any) {
      console.error('Failed to create auto wallets:', error);
      throw new Error(`Failed to create auto wallets: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string, network: string): Promise<string> {
    try {
      const bridgePath = '../../cdp-bridge.mjs';
      const bridge = await eval(`import('${bridgePath}')`) as any;
      return await bridge.getWalletBalance(address, network);
    } catch (error: any) {
      console.error('Failed to get wallet balance:', error);
      return '0.0000';
    }
  }

  /**
   * Request faucet funds for testing
   */
  async requestFaucet(address: string, network: string, token: string = 'eth'): Promise<any> {
    try {
      const bridgePath = '../../cdp-bridge.mjs';
      const bridge = await eval(`import('${bridgePath}')`) as any;
      return await bridge.requestFaucet(address, network, token);
    } catch (error: any) {
      console.error('Failed to request faucet:', error);
      throw new Error(`Failed to request faucet: ${error.message}`);
    }
  }

  /**
   * Send transaction using Coinbase Cloud
   */
  async sendTransaction(
    walletId: string,
    toAddress: string,
    amount: string,
    currency: string,
    network: string = 'ethereum'
  ): Promise<TransactionResult> {
    try {
      console.log(`Sending transaction: ${amount} ${currency} from ${walletId} to ${toAddress} on ${network}`);
      
      // Dynamically import the ES module bridge
      const bridge = await eval(`import('./cdp-bridge.mjs')`);
      
      const result = await bridge.sendTransaction(walletId, toAddress, amount, currency, network);
      
      console.log('Transaction sent successfully:', result);
      
      return {
        success: true,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        status: result.status
      };
    } catch (error: any) {
      console.error('Failed to send transaction:', error);
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  /**
   * Get supported networks
   */
  async getSupportedNetworks(): Promise<Array<{network: string, name: string, currency: string}>> {
    try {
      const bridgePath = '../../cdp-bridge.mjs';
      const bridge = await eval(`import('${bridgePath}')`) as any;
      return bridge.getSupportedNetworks();
    } catch (error: any) {
      console.error('Failed to get supported networks:', error);
      return [
        { network: 'ethereum', name: 'Ethereum', currency: 'ETH' },
        { network: 'polygon', name: 'Polygon', currency: 'MATIC' },
        { network: 'base', name: 'Base', currency: 'ETH' },
        { network: 'arbitrum', name: 'Arbitrum', currency: 'ETH' },
        { network: 'solana', name: 'Solana', currency: 'SOL' },
      ];
    }
  }
}

// Export singleton instance
const coinbaseCloudService = new CoinbaseCloudService();
export { coinbaseCloudService };