-- Merchant settings table for account preferences
CREATE TABLE IF NOT EXISTS merchant_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  support_email TEXT,
  website_url TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  branding_primary TEXT,
  branding_secondary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_settings_user_id ON merchant_settings(user_id);

CREATE TRIGGER update_merchant_settings_updated_at BEFORE UPDATE ON merchant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


