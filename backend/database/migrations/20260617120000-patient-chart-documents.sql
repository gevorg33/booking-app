-- vert-clinic-2.5.5: Patient chart documents (lab PDFs, referral letters, imaging reports)

CREATE TABLE IF NOT EXISTS patient_chart_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  category VARCHAR(32) NOT NULL,
  title VARCHAR(255),
  original_file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL DEFAULT 'application/pdf',
  file_size_bytes INTEGER NOT NULL,
  storage_public_id VARCHAR(512) NOT NULL,
  storage_url TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  uploaded_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  released_to_patient BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_chart_documents_business_customer
  ON patient_chart_documents(business_id, customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_chart_documents_category
  ON patient_chart_documents(business_id, customer_id, category);
