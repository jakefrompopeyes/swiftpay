-- Add network and currency columns to wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network VARCHAR(50) DEFAULT 'ethereum';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ETH';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS mnemonic TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_network ON wallets(network);
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON wallets(currency);

-- Update existing wallets to have network and currency
UPDATE wallets SET network = 'ethereum', currency = 'ETH' WHERE network IS NULL;


