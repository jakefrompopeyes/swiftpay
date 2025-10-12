-- Complete schema migration for SwiftPay
-- This creates all missing tables and updates existing ones

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to wallets table (if not already added)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network VARCHAR(50) DEFAULT 'ethereum';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ETH';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS mnemonic TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create payment_requests table (MISSING!)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  network VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  to_address VARCHAR(255) NOT NULL,
  tx_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add password column to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_to_address ON payment_requests(to_address);
CREATE INDEX IF NOT EXISTS idx_payment_requests_network ON payment_requests(network);
CREATE INDEX IF NOT EXISTS idx_wallets_network ON wallets(network);
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON wallets(currency);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON wallets(is_active);

-- Create updated_at trigger for payment_requests
CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for payment_requests
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_requests
CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own payment requests" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own payment requests" ON payment_requests
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Public read access for payment request details (for checkout pages)
CREATE POLICY "Public can view payment requests" ON payment_requests
  FOR SELECT USING (true);

-- Update existing wallets to have network and currency if they don't
UPDATE wallets SET network = 'ethereum', currency = 'ETH' WHERE network IS NULL OR currency IS NULL;

-- Update existing users to have password if they don't (set to empty string for existing users)
UPDATE users SET password = '' WHERE password IS NULL;
