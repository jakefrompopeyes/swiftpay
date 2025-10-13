// ES Module bridge for Coinbase CDP SDK
// This file runs as an ES module and provides a comprehensive API

import { CdpClient } from '@coinbase/cdp-sdk';

// Initialize CDP client with environment variables
const apiKey = process.env.CDP_API_KEY_ID;
const apiSecret = process.env.CDP_API_KEY_SECRET;

const cdp = new CdpClient({
  apiKey: apiKey,
  apiSecret: apiSecret,
});

export async function createEVMWallet(network = 'ethereum') {
  try {
    console.log(`Creating EVM wallet for network: ${network}`);
    console.log(`CDP API Key: ${apiKey ? 'Present' : 'Missing'}`);
    console.log(`CDP API Secret: ${apiSecret ? 'Present' : 'Missing'}`);
    
    const account = await cdp.evm.createAccount();
    console.log(`✅ Created EVM wallet: ${account.address}`);
    
    return {
      walletId: account.address,
      address: account.address,
      network: network,
      currency: mapNetworkToCurrency(network),
      type: 'EVM',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Failed to create EVM wallet for ${network}:`, error);
    throw new Error(`Failed to create EVM wallet: ${error.message}`);
  }
}

export async function createSolanaWallet() {
  try {
    console.log('Creating Solana wallet');
    console.log(`CDP API Key: ${apiKey ? 'Present' : 'Missing'}`);
    console.log(`CDP API Secret: ${apiSecret ? 'Present' : 'Missing'}`);
    
    const account = await cdp.solana.createAccount();
    console.log(`✅ Created Solana wallet: ${account.address}`);
    
    return {
      walletId: account.address,
      address: account.address,
      network: 'solana',
      currency: 'SOL',
      type: 'Solana',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to create Solana wallet:', error);
    throw new Error(`Failed to create Solana wallet: ${error.message}`);
  }
}

export async function createBitcoinWallet() {
  try {
    // For Bitcoin, we'll use a mock address since CDP SDK doesn't have Bitcoin support yet
    // In production, you'd integrate with a Bitcoin wallet service
    const mockAddress = `bc1q${Math.random().toString(36).substring(2, 42)}`;
    return {
      walletId: mockAddress,
      address: mockAddress,
      network: 'bitcoin',
      currency: 'BTC',
      type: 'Bitcoin',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to create Bitcoin wallet: ${error.message}`);
  }
}

export async function createTronWallet() {
  try {
    // For TRON, we'll use a mock address since CDP SDK doesn't have TRON support yet
    // In production, you'd integrate with a TRON wallet service
    const mockAddress = `T${Math.random().toString(36).substring(2, 34)}`;
    return {
      walletId: mockAddress,
      address: mockAddress,
      network: 'tron',
      currency: 'TRX',
      type: 'TRON',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to create TRON wallet: ${error.message}`);
  }
}

export async function createBSCWallet() {
  try {
    console.log('Creating BSC wallet');
    console.log(`CDP API Key: ${apiKey ? 'Present' : 'Missing'}`);
    console.log(`CDP API Secret: ${apiSecret ? 'Present' : 'Missing'}`);
    
    const account = await cdp.evm.createAccount();
    console.log(`✅ Created BSC wallet: ${account.address}`);
    
    return {
      walletId: account.address,
      address: account.address,
      network: 'bsc',
      currency: 'BNB',
      type: 'EVM',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to create BSC wallet:', error);
    throw new Error(`Failed to create BSC wallet: ${error.message}`);
  }
}

export async function getWalletBalance(address, network) {
  try {
    // For now, return a mock balance since CDP SDK doesn't have direct balance method
    // In production, you'd query the blockchain directly or use CDP's balance API
    const mockBalances = {
      'ethereum': '0.0000',
      'polygon': '0.0000',
      'base': '0.0000',
      'arbitrum': '0.0000',
      'solana': '0.0000',
      'bsc': '0.0000',
      'binance': '0.0000',
      'bitcoin': '0.00000000',
      'tron': '0.0000'
    };
    
    return mockBalances[network] || '0.0000';
  } catch (error) {
    console.error(`Failed to get balance for ${address} on ${network}:`, error);
    return '0.0000';
  }
}

export async function requestFaucet(address, network, token = 'eth') {
  try {
    console.log(`Requesting faucet for ${address} on ${network} with token ${token}`);
    
    if (network === 'solana') {
      const result = await cdp.solana.requestFaucet({
        address: address,
        token: 'sol'
      });
      return {
        success: true,
        amount: '0.1',
        txHash: result.signature,
        message: `Faucet request successful for ${token}`
      };
    } else {
      const result = await cdp.evm.requestFaucet({
        address: address,
        network: mapNetworkToCDPNetwork(network),
        token: token
      });
      return {
        success: true,
        amount: '0.1',
        txHash: result.transactionHash,
        message: `Faucet request successful for ${token}`
      };
    }
  } catch (error) {
    console.error('Failed to request faucet:', error);
    throw new Error(`Failed to request faucet: ${error.message}`);
  }
}

export async function sendTransaction(walletId, toAddress, amount, currency, network) {
  try {
    console.log(`Sending ${amount} ${currency} from ${walletId} to ${toAddress} on ${network}`);
    
    if (network === 'solana') {
      const result = await cdp.solana.sendTransaction({
        from: walletId,
        to: toAddress,
        amount: amount,
        token: currency.toLowerCase()
      });
      return {
        success: true,
        txHash: result.signature,
        explorerUrl: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`,
        status: 'completed'
      };
    } else {
      // For EVM networks (Ethereum, Polygon, Base, Arbitrum, BSC)
      const result = await cdp.evm.sendTransaction({
        from: walletId,
        to: toAddress,
        amount: amount,
        network: mapNetworkToCDPNetwork(network),
        token: currency.toLowerCase()
      });
      return {
        success: true,
        txHash: result.transactionHash,
        explorerUrl: getExplorerUrl(network, result.transactionHash),
        status: 'completed'
      };
    }
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}

export function getSupportedNetworks() {
  return [
    { network: 'ethereum', name: 'Ethereum', currency: 'ETH', type: 'EVM' },
    { network: 'polygon', name: 'Polygon', currency: 'MATIC', type: 'EVM' },
    { network: 'base', name: 'Base', currency: 'ETH', type: 'EVM' },
    { network: 'arbitrum', name: 'Arbitrum', currency: 'ETH', type: 'EVM' },
    { network: 'solana', name: 'Solana', currency: 'SOL', type: 'Solana' },
    { network: 'bsc', name: 'BNB Smart Chain', currency: 'BNB', type: 'EVM' }
  ];
}

export function getAutoCreateNetworks() {
  return [
    { network: 'ethereum', name: 'Ethereum', currency: 'ETH' },
    { network: 'solana', name: 'Solana', currency: 'SOL' },
    { network: 'bsc', name: 'BNB Smart Chain', currency: 'BNB' }
  ];
}

function mapNetworkToCurrency(network) {
  const currencyMap = {
    'ethereum': 'ETH',
    'polygon': 'MATIC',
    'base': 'ETH',
    'arbitrum': 'ETH',
    'solana': 'SOL',
    'bsc': 'BNB',
    'bitcoin': 'BTC',
    'tron': 'TRX'
  };
  return currencyMap[network] || 'ETH';
}

function mapNetworkToCDPNetwork(network) {
  const networkMap = {
    'ethereum': 'ethereum',
    'polygon': 'polygon',
    'base': 'base',
    'arbitrum': 'arbitrum',
    'bsc': 'bsc',
    'binance': 'bsc'
  };
  return networkMap[network] || 'ethereum';
}

function getExplorerUrl(network, txHash) {
  const explorerMap = {
    'ethereum': `https://etherscan.io/tx/${txHash}`,
    'polygon': `https://polygonscan.com/tx/${txHash}`,
    'base': `https://basescan.org/tx/${txHash}`,
    'arbitrum': `https://arbiscan.io/tx/${txHash}`,
    'bsc': `https://bscscan.com/tx/${txHash}`,
    'binance': `https://bscscan.com/tx/${txHash}`
  };
  return explorerMap[network] || `https://etherscan.io/tx/${txHash}`;
}
