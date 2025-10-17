-- Track wallet source (cdp|custom|imported)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'cdp';


