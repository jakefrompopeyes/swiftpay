-- Ensure payment_requests has required columns and correct nullability
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table if missing (idempotent shape)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  network VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','expired')),
  to_address VARCHAR(255),
  tx_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Columns that may be missing in older deployments
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS method_selected BOOLEAN DEFAULT FALSE;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(255);

-- Allow coin-agnostic creation (network/to_address optional)
ALTER TABLE payment_requests ALTER COLUMN network DROP NOT NULL;
ALTER TABLE payment_requests ALTER COLUMN to_address DROP NOT NULL;

-- Indexes for monitor performance
CREATE INDEX IF NOT EXISTS idx_pr_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_created_at ON payment_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_pr_user_id ON payment_requests(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


