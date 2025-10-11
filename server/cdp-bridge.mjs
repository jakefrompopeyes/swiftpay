// ES Module bridge for Coinbase CDP SDK
// This file runs as an ES module and provides a comprehensive API

import { CdpClient } from '@coinbase/cdp-sdk';
import dotenv from 'dotenv';

dotenv.config();

const cdp = new CdpClient();

export async function createEVMWallet(network = 'ethereum') {
  try {
    const account = await cdp.evm.createAccount();
    return {
      walletId: account.address,
      address: account.address,
      network: network,
      currency: mapNetworkToCurrency(network),
      type: 'EVM',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to create EVM wallet: ${error.message}`);
  }
}

export async function createSolanaWallet() {
  try {
    const account = await cdp.solana.createAccount();
    return {
      walletId: account.address,
      address: account.address,
      network: 'solana',
      currency: 'SOL',
      type: 'Solana',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
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
    const mockAddress = `T${Math.random().toString(36).substring(2, 42)}`;
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
    // BSC is EVM-compatible, so we can use the EVM account creation
    const account = await cdp.evm.createAccount();
    return {
      walletId: account.address,
      address: account.address,
      network: 'bsc',
      currency: 'BNB',
      type: 'EVM',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to create BSC wallet: ${error.message}`);
  }
}

export async function getWalletBalance(address, network) {
  try {
    // For now, return a mock balance since CDP SDK doesn't have direct balance method
    // In production, you'd query the blockchain directly or use CDP's balance API
    const mockBalances = {
      'ethereum': '0.1234',
      'polygon': '1.5678',
      'base': '0.0987',
      'arbitrum': '0.5432',
      'solana': '2.3456'
    };
    
    return mockBalances[network] || '0.0000';
  } catch (error) {
    console.error('Failed to get wallet balance:', error);
    return '0.0000';
  }
}

export async function requestFaucet(address, network, token = 'eth') {
  try {
    if (network === 'solana') {
      const result = await cdp.solana.requestFaucet({
        address: address,
        token: 'sol'
      });
      return {
        success: true,
        transactionHash: result.signature,
        explorerUrl: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`
      };
    } else {
      const result = await cdp.evm.requestFaucet({
        address: address,
        network: mapNetworkToCDPNetwork(network),
        token: token
      });
      return {
        success: true,
        transactionHash: result.transactionHash,
        explorerUrl: getExplorerUrl(network, result.transactionHash)
      };
    }
  } catch (error) {
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
    { 
      network: 'ethereum', 
      name: 'Ethereum', 
      currency: 'ETH',
      type: 'EVM',
      icon: '🔷',
      description: 'Ethereum Mainnet',
      testnet: false,
      autoCreate: true
    },
    { 
      network: 'bitcoin', 
      name: 'Bitcoin', 
      currency: 'BTC',
      type: 'Bitcoin',
      icon: '🟠',
      description: 'Bitcoin Network',
      testnet: false,
      autoCreate: true
    },
    { 
      network: 'solana', 
      name: 'Solana', 
      currency: 'SOL',
      type: 'Solana',
      icon: '🟣',
      description: 'Solana Blockchain',
      testnet: false,
      autoCreate: true
    },
    { 
      network: 'tron', 
      name: 'TRON', 
      currency: 'TRX',
      type: 'TRON',
      icon: '🔴',
      description: 'TRON Network',
      testnet: false,
      autoCreate: true
    },
    { 
      network: 'bsc', 
      name: 'BNB Smart Chain', 
      currency: 'BNB',
      type: 'EVM',
      icon: '🟡',
      description: 'BNB Smart Chain',
      testnet: false,
      autoCreate: true
    },
    { 
      network: 'polygon', 
      name: 'Polygon', 
      currency: 'MATIC',
      type: 'EVM',
      icon: '🟣',
      description: 'Polygon PoS Network',
      testnet: false,
      autoCreate: false
    },
    { 
      network: 'base', 
      name: 'Base', 
      currency: 'ETH',
      type: 'EVM',
      icon: '🔵',
      description: 'Base Layer 2',
      testnet: false,
      autoCreate: false
    },
    { 
      network: 'arbitrum', 
      name: 'Arbitrum', 
      currency: 'ETH',
      type: 'EVM',
      icon: '🔴',
      description: 'Arbitrum One',
      testnet: false,
      autoCreate: false
    },
  ];
}

export function getAutoCreateNetworks() {
  return getSupportedNetworks().filter(network => network.autoCreate);
}

export function getTestnetNetworks() {
  return [
    { 
      network: 'ethereum-sepolia', 
      name: 'Ethereum Sepolia', 
      currency: 'ETH',
      type: 'EVM',
      icon: '🔷',
      description: 'Ethereum Testnet',
      testnet: true
    },
    { 
      network: 'polygon-mumbai', 
      name: 'Polygon Mumbai', 
      currency: 'MATIC',
      type: 'EVM',
      icon: '🟣',
      description: 'Polygon Testnet',
      testnet: true
    },
    { 
      network: 'base-sepolia', 
      name: 'Base Sepolia', 
      currency: 'ETH',
      type: 'EVM',
      icon: '🔵',
      description: 'Base Testnet',
      testnet: true
    },
    { 
      network: 'arbitrum-sepolia', 
      name: 'Arbitrum Sepolia', 
      currency: 'ETH',
      type: 'EVM',
      icon: '🔴',
      description: 'Arbitrum Testnet',
      testnet: true
    },
    { 
      network: 'solana-devnet', 
      name: 'Solana Devnet', 
      currency: 'SOL',
      type: 'Solana',
      icon: '🟣',
      description: 'Solana Testnet',
      testnet: true
    },
  ];
}

function mapNetworkToCurrency(network) {
  const mapping = {
    'ethereum': 'ETH',
    'ethereum-sepolia': 'ETH',
    'polygon': 'MATIC',
    'polygon-mumbai': 'MATIC',
    'base': 'ETH',
    'base-sepolia': 'ETH',
    'arbitrum': 'ETH',
    'arbitrum-sepolia': 'ETH',
    'solana': 'SOL',
    'solana-devnet': 'SOL',
  };
  return mapping[network] || 'ETH';
}

function mapNetworkToCDPNetwork(network) {
  const mapping = {
    'ethereum': 'ethereum-mainnet',
    'ethereum-sepolia': 'ethereum-sepolia',
    'polygon': 'polygon-mainnet',
    'polygon-mumbai': 'polygon-mumbai',
    'base': 'base-mainnet',
    'base-sepolia': 'base-sepolia',
    'arbitrum': 'arbitrum-mainnet',
    'arbitrum-sepolia': 'arbitrum-sepolia',
  };
  return mapping[network] || 'ethereum-mainnet';
}

function getExplorerUrl(network, txHash) {
  const explorers = {
    'ethereum': `https://etherscan.io/tx/${txHash}`,
    'ethereum-sepolia': `https://sepolia.etherscan.io/tx/${txHash}`,
    'polygon': `https://polygonscan.com/tx/${txHash}`,
    'polygon-mumbai': `https://mumbai.polygonscan.com/tx/${txHash}`,
    'base': `https://basescan.org/tx/${txHash}`,
    'base-sepolia': `https://sepolia.basescan.org/tx/${txHash}`,
    'arbitrum': `https://arbiscan.io/tx/${txHash}`,
    'arbitrum-sepolia': `https://sepolia.arbiscan.io/tx/${txHash}`,
  };
  return explorers[network] || `https://etherscan.io/tx/${txHash}`;
}
