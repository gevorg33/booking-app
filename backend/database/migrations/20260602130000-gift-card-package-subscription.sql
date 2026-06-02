-- Gift cards: purchasable service packages and subscription plans

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS package_id uuid,
  ADD COLUMN IF NOT EXISTS subscription_plan_id uuid,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_by_customer_id uuid;

CREATE INDEX IF NOT EXISTS idx_gift_cards_package
  ON gift_cards (business_id, package_id)
  WHERE package_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gift_cards_subscription_plan
  ON gift_cards (business_id, subscription_plan_id)
  WHERE subscription_plan_id IS NOT NULL;
