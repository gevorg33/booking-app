-- gap-8.3: Admin service packages (catalog)

CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(1024),
  discount_type VARCHAR(16) NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_packages_business ON service_packages(business_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(business_id, is_active);

CREATE TABLE IF NOT EXISTS service_package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (package_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_service_package_items_package ON service_package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_service_package_items_service ON service_package_items(service_id);

CREATE TABLE IF NOT EXISTS package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  price_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_purchases_package ON package_purchases(package_id);
CREATE INDEX IF NOT EXISTS idx_package_purchases_business ON package_purchases(business_id);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS package_purchase_id UUID REFERENCES package_purchases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_package_purchase ON bookings(package_purchase_id);
