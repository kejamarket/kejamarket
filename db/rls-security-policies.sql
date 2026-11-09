-- ═════════════════════════════════════════════════════════════════════════════════
-- KEJAMARKET ROW LEVEL SECURITY (RLS) POLICIES
-- ═════════════════════════════════════════════════════════════════════════════════
-- Enable RLS on all public tables and create proper access control policies
-- Fixes Supabase Security Advisor errors
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. PROMOTIONS TABLE - RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read" ON public.promotions;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.promotions;
DROP POLICY IF EXISTS "Allow owner/admin write" ON public.promotions;
DROP POLICY IF EXISTS "Allow admin delete" ON public.promotions;

CREATE POLICY "Allow public read promotions"
ON public.promotions FOR SELECT
USING (status = 'active' OR auth.uid() IS NOT NULL);

-- WRITE: Only admins can create/update promotions
CREATE POLICY "Allow admin write promotions"
ON public.promotions FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.admin_users WHERE role = 'admin'
));

-- UPDATE: Only admins can update promotions
CREATE POLICY "Allow admin update promotions"
ON public.promotions FOR UPDATE
USING (auth.uid() IN (
  SELECT user_id FROM public.admin_users WHERE role = 'admin'
))
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.admin_users WHERE role = 'admin'
));

-- DELETE: Only admins can delete promotions
CREATE POLICY "Allow admin delete promotions"
ON public.promotions FOR DELETE
USING (auth.uid() IN (
  SELECT user_id FROM public.admin_users WHERE role = 'admin'
));

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. HOUSE_HUNTS TABLE - RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.house_hunts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read" ON public.house_hunts;
DROP POLICY IF EXISTS "Allow own write" ON public.house_hunts;
DROP POLICY IF EXISTS "Allow admin delete" ON public.house_hunts;

-- READ: Authenticated users can read
CREATE POLICY "Allow authenticated read house_hunts"
ON public.house_hunts FOR SELECT
USING (auth.role() = 'authenticated' OR auth.uid() = created_by);

-- WRITE: Only creator can insert/update own house hunts
CREATE POLICY "Allow owner write house_hunts"
ON public.house_hunts FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only creator can update their hunt
CREATE POLICY "Allow owner update house_hunts"
ON public.house_hunts FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- DELETE: Only creator or admin can delete
CREATE POLICY "Allow owner delete house_hunts"
ON public.house_hunts FOR DELETE
USING (
  auth.uid() = created_by OR 
  auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin')
);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. PROPERTY_MEDIA TABLE - RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read media" ON public.property_media;
DROP POLICY IF EXISTS "Allow owner write media" ON public.property_media;
DROP POLICY IF EXISTS "Allow admin delete media" ON public.property_media;

-- READ: Everyone can read property media
CREATE POLICY "Allow public read property_media"
ON public.property_media FOR SELECT
USING (true);

-- WRITE: Only property owner or admin can upload media
CREATE POLICY "Allow owner write property_media"
ON public.property_media FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.properties WHERE id = property_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- UPDATE: Only owner or admin can update media
CREATE POLICY "Allow owner update property_media"
ON public.property_media FOR UPDATE
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.properties WHERE id = property_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.properties WHERE id = property_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- DELETE: Only admin can delete media
CREATE POLICY "Allow admin delete property_media"
ON public.property_media FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. PROPERTY_REVIEWS TABLE - RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read reviews" ON public.property_reviews;
DROP POLICY IF EXISTS "Allow authenticated write" ON public.property_reviews;
DROP POLICY IF EXISTS "Allow own delete" ON public.property_reviews;

-- READ: Everyone can read reviews
CREATE POLICY "Allow public read property_reviews"
ON public.property_reviews FOR SELECT
USING (true);

-- WRITE: Only authenticated users can create reviews
CREATE POLICY "Allow authenticated write property_reviews"
ON public.property_reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- UPDATE: Only reviewer or admin can update
CREATE POLICY "Allow owner update property_reviews"
ON public.property_reviews FOR UPDATE
USING (
  auth.uid() = reviewer_id OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = reviewer_id OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- DELETE: Only reviewer or admin can delete
CREATE POLICY "Allow owner delete property_reviews"
ON public.property_reviews FOR DELETE
USING (
  auth.uid() = reviewer_id OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. SERVICES TABLE - RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read services" ON public.services;
DROP POLICY IF EXISTS "Allow owner write" ON public.services;
DROP POLICY IF EXISTS "Allow admin delete" ON public.services;

-- READ: Everyone can read active services
CREATE POLICY "Allow public read services"
ON public.services FOR SELECT
USING (status = 'active' OR auth.uid() = provider_id);

-- WRITE: Service providers can create their own services
CREATE POLICY "Allow provider write services"
ON public.services FOR INSERT
WITH CHECK (auth.uid() = provider_id);

-- UPDATE: Only provider or admin can update
CREATE POLICY "Allow provider update services"
ON public.services FOR UPDATE
USING (
  auth.uid() = provider_id OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = provider_id OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- DELETE: Only admin can delete services
CREATE POLICY "Allow admin delete services"
ON public.services FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. MARKETPLACE_ITEMS TABLE - RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Allow seller write" ON public.marketplace_items;
DROP POLICY IF EXISTS "Allow admin delete" ON public.marketplace_items;

-- READ: Everyone can read active marketplace items
CREATE POLICY "Allow public read marketplace_items"
ON public.marketplace_items FOR SELECT
USING (status = 'active' OR auth.uid() = seller_id);

-- WRITE: Sellers can create their own listings
CREATE POLICY "Allow seller write marketplace_items"
ON public.marketplace_items FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- UPDATE: Only seller or admin can update
CREATE POLICY "Allow seller update marketplace_items"
ON public.marketplace_items FOR UPDATE
USING (
  auth.uid() = seller_id OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = seller_id OR
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- DELETE: Only admin can delete items
CREATE POLICY "Allow admin delete marketplace_items"
ON public.marketplace_items FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users WHERE role = 'admin'
  )
);

-- ═════════════════════════════════════════════════════════════════════════════════
-- SUMMARY OF POLICIES
-- ═════════════════════════════════════════════════════════════════════════════════
--
-- TABLE: promotions
--   READ:   Anyone (active only) or authenticated users
--   WRITE:  Admin only
--   UPDATE: Admin only
--   DELETE: Admin only
--
-- TABLE: house_hunts
--   READ:   Authenticated users (see own or others')
--   WRITE:  Creator only
--   UPDATE: Creator only
--   DELETE: Creator or Admin
--
-- TABLE: property_media
--   READ:   Public (everyone)
--   WRITE:  Property owner or Admin
--   UPDATE: Property owner or Admin
--   DELETE: Admin only
--
-- TABLE: property_reviews
--   READ:   Public (everyone)
--   WRITE:  Reviewer (authenticated)
--   UPDATE: Reviewer or Admin
--   DELETE: Reviewer or Admin
--
-- TABLE: services
--   READ:   Public (active only) or provider can see own
--   WRITE:  Service provider
--   UPDATE: Provider or Admin
--   DELETE: Admin only
--
-- TABLE: marketplace_items
--   READ:   Public (active only) or seller can see own
--   WRITE:  Seller
--   UPDATE: Seller or Admin
--   DELETE: Admin only
--
-- ═════════════════════════════════════════════════════════════════════════════════
