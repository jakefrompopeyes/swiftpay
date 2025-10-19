-- Webhook deliveries log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  request_body JSONB NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT FALSE,
  attempt_count INTEGER DEFAULT 1,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_payment_id ON webhook_deliveries(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_user_id ON webhook_deliveries(user_id);

-- trigger for updated_at
CREATE TRIGGER update_webhook_deliveries_updated_at BEFORE UPDATE ON webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


