import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          password: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          password: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password?: string
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          address: string
          private_key: string
          network: string
          currency: string
          mnemonic: string | null
          balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          address: string
          private_key: string
          network?: string
          currency?: string
          mnemonic?: string | null
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          address?: string
          private_key?: string
          network?: string
          currency?: string
          mnemonic?: string | null
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_requests: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          network: string
          description: string | null
          status: 'pending' | 'completed' | 'failed' | 'expired'
          to_address: string
          tx_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency: string
          network: string
          description?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'expired'
          to_address: string
          tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          network?: string
          description?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'expired'
          to_address?: string
          tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          from_wallet_id: string
          to_wallet_id: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed'
          tx_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_wallet_id: string
          to_wallet_id: string
          amount: number
          currency: string
          status?: 'pending' | 'completed' | 'failed'
          tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_wallet_id?: string
          to_wallet_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed'
          tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          user_id: string
          business_name: string
          api_key: string
          webhook_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          api_key: string
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          api_key?: string
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
