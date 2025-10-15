-- Allow coin-agnostic creation: network/to_address can be filled after selection
ALTER TABLE payment_requests ALTER COLUMN to_address DROP NOT NULL;
ALTER TABLE payment_requests ALTER COLUMN network DROP NOT NULL;


