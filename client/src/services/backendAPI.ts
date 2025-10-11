// Backend API Service for SwiftPay Frontend
import { API_CONFIG } from '../config/api';

const BACKEND_BASE_URL = API_CONFIG.BACKEND.BASE_URL;

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface Wallet {
  id: string;
  address: string;
  network: string;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  status: string;
  tx_hash?: string;
  explorerUrl?: string;
  created_at: string;
  from_wallet?: { address: string };
  to_wallet?: { address: string };
}

export interface CryptoPrice {
  [key: string]: number;
}

export interface Cryptocurrency {
  symbol: string;
  name: string;
  logo: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('swiftpay_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// Auth API
export const authAPI = {
  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password })
    });
    return handleResponse(response);
  },
  

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  },

  async verify(): Promise<{ success: boolean; data: { user: User } }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.AUTH.VERIFY}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Users API
export const usersAPI = {
  async getProfile(): Promise<{ success: boolean; data: { user: User; wallets: Wallet[]; isVendor: boolean } }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.USERS.PROFILE}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async updateProfile(name: string): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.USERS.PROFILE}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  }
};

// Wallets API
export const walletsAPI = {
  async getWallets(): Promise<{ success: boolean; data: Wallet[] }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.WALLETS.LIST}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async createWallet(network: string = 'ethereum'): Promise<{ success: boolean; message: string; data: Wallet }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.WALLETS.CREATE}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ network })
    });
    return handleResponse(response);
  },

  async getBalance(walletId: string): Promise<{ success: boolean; data: { address: string; balance: string } }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.WALLETS.BALANCE.replace(':id', walletId)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async deleteWallet(walletId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.WALLETS.DELETE.replace(':id', walletId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async getSupportedNetworks(): Promise<{ success: boolean; data: any[] }> {
    const response = await fetch(`${BACKEND_BASE_URL}/api/wallets/networks`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async requestFaucet(walletId: string, token: string = 'eth'): Promise<{ success: boolean; data: any }> {
    const response = await fetch(`${BACKEND_BASE_URL}/api/wallets/${walletId}/faucet`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token })
    });
    return handleResponse(response);
  }
};

// Transactions API
export const transactionsAPI = {
  async getTransactions(): Promise<{ success: boolean; data: Transaction[] }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.TRANSACTIONS.LIST}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async createTransaction(toAddress: string, amount: string, currency: string, network: string = 'ethereum'): Promise<{ success: boolean; message: string; data: { id: string; txHash: string; explorerUrl?: string; status: string } }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.TRANSACTIONS.CREATE}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ toAddress, amount, currency, network })
    });
    return handleResponse(response);
  },

  async getTransaction(transactionId: string): Promise<{ success: boolean; data: Transaction }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.TRANSACTIONS.DETAIL.replace(':id', transactionId)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Public API
export const publicAPI = {
  async getHealth(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.PUBLIC.HEALTH}`);
    return handleResponse(response);
  },

  async getPrices(): Promise<{ success: boolean; data: CryptoPrice }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.PUBLIC.PRICES}`);
    return handleResponse(response);
  },

  async getCryptocurrencies(): Promise<{ success: boolean; data: Cryptocurrency[] }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.PUBLIC.CRYPTOCURRENCIES}`);
    return handleResponse(response);
  }
};

// Vendors API
export const vendorsAPI = {
  async getProfile(): Promise<{ success: boolean; data: any }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.VENDORS.PROFILE}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async createProfile(businessName: string, webhookUrl?: string): Promise<{ success: boolean; message: string; data: any }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.VENDORS.PROFILE}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ businessName, webhookUrl })
    });
    return handleResponse(response);
  },

  async getAnalytics(): Promise<{ success: boolean; data: any }> {
    const response = await fetch(`${BACKEND_BASE_URL}${API_CONFIG.BACKEND.ENDPOINTS.VENDORS.ANALYTICS}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Export all APIs
export const backendAPI = {
  auth: authAPI,
  users: usersAPI,
  wallets: walletsAPI,
  transactions: transactionsAPI,
  vendors: vendorsAPI,
  public: publicAPI,
  paymentRequests: {
    async create(amount: string, currency: string, description?: string) {
      const response = await fetch(`${BACKEND_BASE_URL}/api/payment-requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, currency, description })
      })
      return handleResponse(response)
    },
    async get(id: string) {
      const response = await fetch(`${BACKEND_BASE_URL}/api/payment-requests/${id}`)
      return handleResponse(response)
    },
    async status(id: string) {
      const response = await fetch(`${BACKEND_BASE_URL}/api/payment-requests/${id}/status`)
      return handleResponse(response)
    },
    async list() {
      const response = await fetch(`${BACKEND_BASE_URL}/api/payment-requests`, {
        headers: getAuthHeaders()
      })
      return handleResponse(response)
    }
  }
};
