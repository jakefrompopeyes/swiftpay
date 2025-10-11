import { ethers } from 'ethers';
import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import ECPairFactory from 'ecpair';

export interface BlockchainConfig {
  name: string;
  currency: string;
  decimals: number;
  explorerUrl: string;
  rpcUrl?: string;
  network?: any;
}

export interface WalletResult {
  address: string;
  privateKey: string;
  mnemonic?: string;
  network: string;
  currency: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export class MultiChainWalletService {
  private configs: Map<string, BlockchainConfig> = new Map();
  private providers: Map<string, any> = new Map();

  constructor() {
    this.initializeNetworks();
  }

  private initializeNetworks() {
    // Ethereum
    this.configs.set('ethereum', {
      name: 'Ethereum',
      currency: 'ETH',
      decimals: 18,
      explorerUrl: 'https://etherscan.io',
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_KEY'
    });

    // Bitcoin
    this.configs.set('bitcoin', {
      name: 'Bitcoin',
      currency: 'BTC',
      decimals: 8,
      explorerUrl: 'https://blockstream.info',
      network: bitcoin.networks.bitcoin
    });

    // Bitcoin Cash
    this.configs.set('bitcoin-cash', {
      name: 'Bitcoin Cash',
      currency: 'BCH',
      decimals: 8,
      explorerUrl: 'https://blockchair.com/bitcoin-cash',
      network: bitcoin.networks.bitcoin // BCH uses same network as BTC
    });

    // Solana
    this.configs.set('solana', {
      name: 'Solana',
      currency: 'SOL',
      decimals: 9,
      explorerUrl: 'https://explorer.solana.com',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    });

    // Polygon
    this.configs.set('polygon', {
      name: 'Polygon',
      currency: 'MATIC',
      decimals: 18,
      explorerUrl: 'https://polygonscan.com',
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
    });

    // Cardano (future support)
    this.configs.set('cardano', {
      name: 'Cardano',
      currency: 'ADA',
      decimals: 6,
      explorerUrl: 'https://cardanoscan.io'
    });

    // Initialize providers
    this.initializeProviders();
  }

  private initializeProviders() {
    this.configs.forEach((config, network) => {
      try {
        switch (network) {
          case 'ethereum':
          case 'polygon':
            if (config.rpcUrl) {
              const provider = new ethers.JsonRpcProvider(config.rpcUrl);
              this.providers.set(network, provider);
              console.log(`✅ Connected to ${config.name} network`);
            }
            break;
          case 'solana':
            if (config.rpcUrl) {
              const connection = new Connection(config.rpcUrl);
              this.providers.set(network, connection);
              console.log(`✅ Connected to ${config.name} network`);
            }
            break;
          case 'bitcoin':
          case 'bitcoin-cash':
            // Bitcoin doesn't need a provider for wallet generation
            console.log(`✅ ${config.name} wallet generation ready`);
            break;
        }
      } catch (error) {
        console.error(`❌ Failed to connect to ${config.name}:`, error);
      }
    });
  }

  async generateWallet(network: string): Promise<WalletResult> {
    const config = this.configs.get(network);
    if (!config) {
      throw new Error(`Unsupported network: ${network}`);
    }

    switch (network) {
      case 'ethereum':
      case 'polygon':
        return this.generateEthereumWallet(network);
      case 'bitcoin':
        return this.generateBitcoinWallet();
      case 'bitcoin-cash':
        return this.generateBitcoinCashWallet();
      case 'solana':
        return this.generateSolanaWallet();
      default:
        throw new Error(`Wallet generation not implemented for ${network}`);
    }
  }

  private generateEthereumWallet(network: string): WalletResult {
    const wallet = ethers.Wallet.createRandom();
    const config = this.configs.get(network)!;
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      network,
      currency: config.currency
    };
  }

  private generateBitcoinWallet(): WalletResult {
    // Generate mnemonic
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic);
    
    // Generate HD wallet
    const bip32 = BIP32Factory(ecc);
    const root = bip32.fromSeed(seed);
    const account = root.derivePath("m/44'/0'/0'/0/0"); // Bitcoin derivation path
    
    // Create key pair
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromPrivateKey(account.privateKey!);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey,
      network: bitcoin.networks.bitcoin 
    });

    return {
      address: address!,
      privateKey: keyPair.toWIF(), // Wallet Import Format
      mnemonic,
      network: 'bitcoin',
      currency: 'BTC'
    };
  }

  private generateBitcoinCashWallet(): WalletResult {
    // Similar to Bitcoin but with BCH address format
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic);
    const bip32 = BIP32Factory(ecc);
    const root = bip32.fromSeed(seed);
    const account = root.derivePath("m/44'/145'/0'/0/0"); // BCH derivation path
    
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromPrivateKey(account.privateKey!);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey,
      network: bitcoin.networks.bitcoin 
    });

    return {
      address: address!,
      privateKey: keyPair.toWIF(),
      mnemonic,
      network: 'bitcoin-cash',
      currency: 'BCH'
    };
  }

  private generateSolanaWallet(): WalletResult {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey;
    
    return {
      address: publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
      network: 'solana',
      currency: 'SOL'
    };
  }

  async getBalance(network: string, address: string): Promise<string> {
    const config = this.configs.get(network);
    if (!config) {
      throw new Error(`Unsupported network: ${network}`);
    }

    switch (network) {
      case 'ethereum':
      case 'polygon':
        return this.getEthereumBalance(network, address);
      case 'bitcoin':
        return this.getBitcoinBalance(address);
      case 'bitcoin-cash':
        return this.getBitcoinCashBalance(address);
      case 'solana':
        return this.getSolanaBalance(address);
      default:
        throw new Error(`Balance checking not implemented for ${network}`);
    }
  }

  private async getEthereumBalance(network: string, address: string): Promise<string> {
    const provider = this.providers.get(network);
    if (!provider) {
      throw new Error(`Provider not found for ${network}`);
    }

    const balance = await provider.getBalance(address);
    const config = this.configs.get(network)!;
    return ethers.formatUnits(balance, config.decimals);
  }

  private async getBitcoinBalance(address: string): Promise<string> {
    try {
      const response = await axios.get(`https://blockstream.info/api/address/${address}`);
      const balance = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
      return (balance / 100000000).toString(); // Convert satoshis to BTC
    } catch (error) {
      console.error('Error fetching Bitcoin balance:', error);
      return '0';
    }
  }

  private async getBitcoinCashBalance(address: string): Promise<string> {
    try {
      const response = await axios.get(`https://blockchair.com/bitcoin-cash/dashboards/address/${address}`);
      const balance = response.data.data[address].address.balance;
      return (balance / 100000000).toString(); // Convert satoshis to BCH
    } catch (error) {
      console.error('Error fetching Bitcoin Cash balance:', error);
      return '0';
    }
  }

  private async getSolanaBalance(address: string): Promise<string> {
    const connection = this.providers.get('solana');
    if (!connection) {
      throw new Error('Solana provider not found');
    }

    try {
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      const config = this.configs.get('solana')!;
      return (balance / Math.pow(10, config.decimals)).toString();
    } catch (error) {
      console.error('Error fetching Solana balance:', error);
      return '0';
    }
  }

  async sendTransaction(
    network: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string
  ): Promise<TransactionResult> {
    const config = this.configs.get(network);
    if (!config) {
      throw new Error(`Unsupported network: ${network}`);
    }

    switch (network) {
      case 'ethereum':
      case 'polygon':
        return this.sendEthereumTransaction(network, fromAddress, toAddress, amount, privateKey);
      case 'bitcoin':
        return this.sendBitcoinTransaction(fromAddress, toAddress, amount, privateKey);
      case 'solana':
        return this.sendSolanaTransaction(fromAddress, toAddress, amount, privateKey);
      default:
        throw new Error(`Transaction sending not implemented for ${network}`);
    }
  }

  private async sendEthereumTransaction(
    network: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string
  ): Promise<TransactionResult> {
    try {
      const provider = this.providers.get(network);
      if (!provider) {
        throw new Error(`Provider not found for ${network}`);
      }

      const wallet = new ethers.Wallet(privateKey, provider);
      const config = this.configs.get(network)!;
      const amountWei = ethers.parseUnits(amount, config.decimals);
      
      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: amountWei
      });

      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendBitcoinTransaction(
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string
  ): Promise<TransactionResult> {
    // Bitcoin transaction implementation would go here
    // This is more complex and requires UTXO management
    return {
      success: false,
      error: 'Bitcoin transactions not yet implemented'
    };
  }

  private async sendSolanaTransaction(
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string
  ): Promise<TransactionResult> {
    // Solana transaction implementation would go here
    return {
      success: false,
      error: 'Solana transactions not yet implemented'
    };
  }

  getSupportedNetworks(): string[] {
    return Array.from(this.configs.keys());
  }

  getNetworkConfig(network: string): BlockchainConfig | undefined {
    return this.configs.get(network);
  }
}
