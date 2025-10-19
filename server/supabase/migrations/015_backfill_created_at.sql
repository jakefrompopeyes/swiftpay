-- Backfill missing created_at for legacy rows so expiry works
UPDATE payment_requests
SET created_at = NOW() - INTERVAL '30 days'
WHERE created_at IS NULL;

-- Ensure default exists for future inserts
ALTER TABLE payment_requests ALTER COLUMN created_at SET DEFAULT NOW();



