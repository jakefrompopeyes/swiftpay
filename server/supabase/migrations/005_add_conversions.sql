-- Add conversions table for tracking coin swaps
CREATE TABLE IF NOT EXISTS conversions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  from_token VARCHAR(10) NOT NULL,
  to_token VARCHAR(10) NOT NULL,
  from_amount DECIMAL(20,8) NOT NULL,
  to_amount DECIMAL(20,8) NOT NULL,
  network VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_hash VARCHAR(255),
  transaction_data JSONB,
  quote_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversions
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_from_wallet_id ON conversions(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);

-- Create updated_at trigger for conversions
CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON conversions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
