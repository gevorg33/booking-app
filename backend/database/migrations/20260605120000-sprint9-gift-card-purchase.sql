-- Sprint 9: customer gift card purchase, fulfillment, type-aware redemption

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS card_type varchar(32) NOT NULL DEFAULT 'monetary',
  ADD COLUMN IF NOT EXISTS delivery_method varchar(32),
  ADD COLUMN IF NOT EXISTS fulfillment_status varchar(64),
  ADD COLUMN IF NOT EXISTS recipient_name varchar(255),
  ADD COLUMN IF NOT EXISTS recipient_email varchar(255),
  ADD COLUMN IF NOT EXISTS recipient_phone varchar(64),
  ADD COLUMN IF NOT EXISTS purchaser_email varchar(255),
  ADD COLUMN IF NOT EXISTS personal_message text,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS shipping_method varchar(64),
  ADD COLUMN IF NOT EXISTS purchase_amount decimal(10, 2),
  ADD COLUMN IF NOT EXISTS shipping_fee decimal(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_id uuid,
  ADD COLUMN IF NOT EXISTS code_revealed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_creator_staff_id uuid,
  ADD COLUMN IF NOT EXISTS delivery_staff_id uuid,
  ADD COLUMN IF NOT EXISTS tracking_carrier varchar(128),
  ADD COLUMN IF NOT EXISTS tracking_number varchar(128),
  ADD COLUMN IF NOT EXISTS card_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS zendesk_ticket_id varchar(64);

CREATE INDEX IF NOT EXISTS idx_gift_cards_fulfillment
  ON gift_cards (business_id, fulfillment_status)
  WHERE fulfillment_status IS NOT NULL;

CREATE TABLE IF NOT EXISTS gift_card_service_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  service_id uuid NOT NULL,
  service_name varchar(255) NOT NULL,
  quantity_total int NOT NULL DEFAULT 1,
  quantity_remaining int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_service_credits_card
  ON gift_card_service_credits (gift_card_id);

CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  business_id uuid NOT NULL,
  booking_id uuid,
  amount decimal(10, 2),
  service_id uuid,
  service_name varchar(255),
  credits_consumed int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_card
  ON gift_card_redemptions (gift_card_id, created_at DESC);
