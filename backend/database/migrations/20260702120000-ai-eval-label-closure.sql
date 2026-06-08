-- acc-6.2 — failure → eval → fix pipeline closure tracking on label queue
ALTER TABLE ai_eval_label_queue
  ADD COLUMN IF NOT EXISTS fix_type varchar(16),
  ADD COLUMN IF NOT EXISTS fix_status varchar(16),
  ADD COLUMN IF NOT EXISTS fix_ref varchar(256),
  ADD COLUMN IF NOT EXISTS closure_summary text,
  ADD COLUMN IF NOT EXISTS closure_applied_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_ai_eval_label_queue_business_fix_status
  ON ai_eval_label_queue (business_id, fix_status);
