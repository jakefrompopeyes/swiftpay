-- Add a flag indicating whether a payment method was selected on checkout
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS method_selected BOOLEAN DEFAULT FALSE;


