-- gc-1.23–1.27, gc-1.31: customer cancel/modify requests with Zendesk + audit

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS stripe_session_id varchar(255);

CREATE INDEX IF NOT EXISTS idx_gift_cards_stripe_session
  ON gift_cards (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS gift_card_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  request_type varchar(16) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  modify_payload jsonb,
  customer_notes text,
  specialist_notes text,
  zendesk_ticket_id varchar(64),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_change_requests_business
  ON gift_card_change_requests (business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gift_card_change_requests_card
  ON gift_card_change_requests (gift_card_id, created_at DESC);
