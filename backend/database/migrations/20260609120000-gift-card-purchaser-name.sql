-- Store purchaser display name for guest gift card buyers (delivery + WhatsApp sender)

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS purchaser_name varchar(255);

CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser_email
  ON gift_cards (business_id, LOWER(purchaser_email))
  WHERE purchaser_customer_id IS NULL AND purchaser_email IS NOT NULL;
