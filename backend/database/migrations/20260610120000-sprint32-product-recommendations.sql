-- Sprint 32: post-checkout product recommendations
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(2048),
  ADD COLUMN IF NOT EXISTS external_link VARCHAR(2048);

CREATE TABLE IF NOT EXISTS service_recommended_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_service_recommended_products_service
  ON service_recommended_products (service_id, sort_order);

CREATE TABLE IF NOT EXISTS category_recommended_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_category_recommended_products_category
  ON category_recommended_products (category_id, sort_order);
