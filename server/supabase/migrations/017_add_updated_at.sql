-- Ensure updated_at exists and trigger updates it on modification

-- 1) Add column if missing
ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Upsert the trigger function (idempotent)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Recreate trigger to use the function
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON payment_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4) Optional: backfill any nulls
UPDATE payment_requests SET updated_at = NOW() WHERE updated_at IS NULL;


