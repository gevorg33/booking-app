-- vert-clinic-2.0.2: Generic clinic test catalog, orders, results, specimens (no patientPlanId)

CREATE TABLE IF NOT EXISTS clinic_test_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(32),
  description TEXT,
  unit VARCHAR(32),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  requires_fasting BOOLEAN NOT NULL DEFAULT FALSE,
  preparation_notes TEXT,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_clinic_test_types_business_active
  ON clinic_test_types(business_id, is_active);

CREATE TABLE IF NOT EXISTS clinic_test_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(32),
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_clinic_test_panels_business_active
  ON clinic_test_panels(business_id, is_active);

CREATE TABLE IF NOT EXISTS clinic_test_panel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id UUID NOT NULL REFERENCES clinic_test_panels(id) ON DELETE CASCADE,
  test_type_id UUID NOT NULL REFERENCES clinic_test_types(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (panel_id, test_type_id)
);

CREATE TABLE IF NOT EXISTS clinic_test_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'NotCollected',
  comment TEXT,
  custom_cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  display_names VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_test_orders_business_status
  ON clinic_test_orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_clinic_test_orders_business_booking
  ON clinic_test_orders(business_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_clinic_test_orders_business_customer
  ON clinic_test_orders(business_id, customer_id);

CREATE TABLE IF NOT EXISTS clinic_test_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES clinic_test_orders(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL,
  test_type_id UUID REFERENCES clinic_test_types(id) ON DELETE SET NULL,
  test_panel_id UUID REFERENCES clinic_test_panels(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_test_order_items_order
  ON clinic_test_order_items(order_id);

CREATE TABLE IF NOT EXISTS clinic_test_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES clinic_test_orders(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  previous_status VARCHAR(32),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_test_order_status_history_order
  ON clinic_test_order_status_history(order_id, created_at);

CREATE TABLE IF NOT EXISTS clinic_specimens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES clinic_test_orders(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  specimen_identifier VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'NotCollected',
  collected_at TIMESTAMPTZ,
  received_in_lab_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  incompletion_reason TEXT,
  collected_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_specimens_business_status
  ON clinic_specimens(business_id, status);
CREATE INDEX IF NOT EXISTS idx_clinic_specimens_order
  ON clinic_specimens(order_id);

CREATE TABLE IF NOT EXISTS clinic_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES clinic_test_orders(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  specimen_id UUID REFERENCES clinic_specimens(id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'NotReceived',
  result_kind VARCHAR(16) NOT NULL DEFAULT 'test_type',
  test_type_id UUID REFERENCES clinic_test_types(id) ON DELETE SET NULL,
  test_panel_id UUID REFERENCES clinic_test_panels(id) ON DELETE SET NULL,
  measurement_flag VARCHAR(32),
  patient_visibility VARCHAR(16),
  comment TEXT,
  review_comment TEXT,
  release_comment TEXT,
  completed_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_test_results_business_status
  ON clinic_test_results(business_id, status);
CREATE INDEX IF NOT EXISTS idx_clinic_test_results_business_customer
  ON clinic_test_results(business_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_clinic_test_results_business_booking
  ON clinic_test_results(business_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_clinic_test_results_order
  ON clinic_test_results(order_id);

CREATE TABLE IF NOT EXISTS clinic_test_result_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES clinic_test_results(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  previous_status VARCHAR(32),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_test_result_status_history_result
  ON clinic_test_result_status_history(result_id, created_at);

CREATE TABLE IF NOT EXISTS clinic_test_result_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES clinic_test_results(id) ON DELETE CASCADE,
  test_type_id UUID NOT NULL REFERENCES clinic_test_types(id) ON DELETE CASCADE,
  value VARCHAR(128),
  measurement_flag VARCHAR(32),
  lab_comment TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_test_result_measurements_result
  ON clinic_test_result_measurements(result_id);
