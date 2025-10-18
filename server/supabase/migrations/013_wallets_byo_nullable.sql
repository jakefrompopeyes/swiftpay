-- BYO wallets support: allow NULL private_key and set sensible defaults

-- Make private_key nullable (we do not store private keys for custom wallets)
ALTER TABLE wallets
  ALTER COLUMN private_key DROP NOT NULL;

-- Ensure source column exists and default is 'custom' for new BYO entries
ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS source VARCHAR(20);

ALTER TABLE wallets
  ALTER COLUMN source SET DEFAULT 'custom';

-- Backfill null sources to 'custom'
UPDATE wallets SET source = 'custom' WHERE source IS NULL;


