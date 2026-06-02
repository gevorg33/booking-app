-- Track Stripe refunds for cancelled gift card purchases
ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS stripe_refund_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_gift_cards_stripe_refund_id
  ON gift_cards (stripe_refund_id)
  WHERE stripe_refund_id IS NOT NULL;
