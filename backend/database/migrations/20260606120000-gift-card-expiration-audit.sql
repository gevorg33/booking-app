-- gc-1.19: admin gift card expiration edits with audit trail

CREATE TABLE IF NOT EXISTS gift_card_expiration_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL,
  action varchar(16) NOT NULL,
  previous_expires_at timestamptz,
  new_expires_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_expiration_audit_card
  ON gift_card_expiration_audit (gift_card_id, created_at DESC);
