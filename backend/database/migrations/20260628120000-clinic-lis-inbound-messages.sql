-- vert-clinic-2.6.2: Background worker queue for inbound HL7/FHIR/vendor LIS webhooks

CREATE TABLE IF NOT EXISTS clinic_lab_sync_inbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source VARCHAR(16) NOT NULL,
  content_type VARCHAR(128) NOT NULL,
  integration_vendor_code VARCHAR(64),
  lab_info_id UUID REFERENCES clinic_lab_info(id) ON DELETE SET NULL,
  idempotency_key VARCHAR(128),
  raw_payload TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'Pending',
  error_message TEXT,
  observation_request_id UUID REFERENCES clinic_lab_sync_observation_requests(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_lab_sync_inbound_messages_idempotency
  ON clinic_lab_sync_inbound_messages(business_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinic_lab_sync_inbound_messages_pending
  ON clinic_lab_sync_inbound_messages(status, received_at)
  WHERE status = 'Pending';
