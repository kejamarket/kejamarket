-- KejaMarket Concierge Services & Marketplace Management

-- Concierge service requests
CREATE TABLE IF NOT EXISTS concierge_requests (
  id TEXT PRIMARY KEY DEFAULT ('conc-' || gen_random_uuid()::text),
  user_id TEXT NOT NULL REFERENCES users(id),
  service_type TEXT NOT NULL CHECK (service_type IN ('cleaning', 'repairs', 'plumbing', 'electrical', 'painting', 'moving', 'fumigation', 'other')),
  property_id TEXT REFERENCES properties(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed')),
  assigned_to TEXT REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_concierge_user ON concierge_requests(user_id);
CREATE INDEX idx_concierge_status ON concierge_requests(status);
CREATE INDEX idx_concierge_assigned ON concierge_requests(assigned_to);
CREATE INDEX idx_concierge_type ON concierge_requests(service_type);
CREATE INDEX idx_concierge_created ON concierge_requests(created_at DESC);

-- Service agents/providers
CREATE TABLE IF NOT EXISTS service_agents (
  id TEXT PRIMARY KEY DEFAULT ('agent-' || gen_random_uuid()::text),
  user_id TEXT NOT NULL REFERENCES users(id),
  agent_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  services TEXT[] NOT NULL,
  areas_served TEXT[],
  rating DECIMAL(3, 2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_user ON service_agents(user_id);
CREATE INDEX idx_agents_services ON service_agents USING GIN(services);
CREATE INDEX idx_agents_active ON service_agents(active, verified);

-- Marketplace products
CREATE TABLE IF NOT EXISTS marketplace_products (
  id TEXT PRIMARY KEY DEFAULT ('prod-' || gen_random_uuid()::text),
  seller_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('furniture', 'appliances', 'decor', 'electronics', 'kitchenware', 'bedding', 'other')),
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  images TEXT[],
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'sold', 'removed')),
  approved_by TEXT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  views INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketplace_seller ON marketplace_products(seller_id);
CREATE INDEX idx_marketplace_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_category ON marketplace_products(category);
CREATE INDEX idx_marketplace_featured ON marketplace_products(featured, status);
CREATE INDEX idx_marketplace_created ON marketplace_products(created_at DESC);

-- Marketplace orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id TEXT PRIMARY KEY DEFAULT ('order-' || gen_random_uuid()::text),
  product_id TEXT NOT NULL REFERENCES marketplace_products(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'disputed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  transaction_id TEXT REFERENCES transactions(id),
  delivery_address TEXT,
  delivery_phone TEXT,
  notes TEXT,
  disputed_reason TEXT,
  resolved_by TEXT REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_product ON marketplace_orders(product_id);
CREATE INDEX idx_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_orders_status ON marketplace_orders(status);
CREATE INDEX idx_orders_created ON marketplace_orders(created_at DESC);

COMMENT ON TABLE concierge_requests IS 'On-demand property services booking';
COMMENT ON TABLE service_agents IS 'Verified service providers';
COMMENT ON TABLE marketplace_products IS 'User-listed items for sale';
COMMENT ON TABLE marketplace_orders IS 'Marketplace purchase orders';
