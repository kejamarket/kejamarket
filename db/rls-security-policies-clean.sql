-- KEJAMARKET ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all public tables and create proper access control policies

-- ========== 1. PROMOTIONS TABLE ==========
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow admin write promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow admin update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow admin delete promotions" ON public.promotions;

CREATE POLICY "Allow public read promotions" ON public.promotions FOR SELECT 
USING (true);

CREATE POLICY "Allow admin write promotions" ON public.promotions FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "Allow admin update promotions" ON public.promotions FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')) 
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "Allow admin delete promotions" ON public.promotions FOR DELETE 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- ========== 2. HOUSE_HUNTS TABLE ==========
ALTER TABLE public.house_hunts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read house_hunts" ON public.house_hunts;
DROP POLICY IF EXISTS "Allow owner write house_hunts" ON public.house_hunts;
DROP POLICY IF EXISTS "Allow owner update house_hunts" ON public.house_hunts;
DROP POLICY IF EXISTS "Allow owner delete house_hunts" ON public.house_hunts;

CREATE POLICY "Allow read house_hunts" ON public.house_hunts FOR SELECT 
USING (true);

CREATE POLICY "Allow owner write house_hunts" ON public.house_hunts FOR INSERT 
WITH CHECK (auth.uid()::text = created_by OR auth.uid() IS NULL);

CREATE POLICY "Allow owner update house_hunts" ON public.house_hunts FOR UPDATE 
USING (auth.uid()::text = created_by) 
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Allow owner delete house_hunts" ON public.house_hunts FOR DELETE 
USING (auth.uid()::text = created_by);

-- ========== 3. PROPERTY_MEDIA TABLE ==========
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read property_media" ON public.property_media;
DROP POLICY IF EXISTS "Allow write property_media" ON public.property_media;
DROP POLICY IF EXISTS "Allow update property_media" ON public.property_media;
DROP POLICY IF EXISTS "Allow delete property_media" ON public.property_media;

CREATE POLICY "Allow public read property_media" ON public.property_media FOR SELECT 
USING (true);

CREATE POLICY "Allow write property_media" ON public.property_media FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update property_media" ON public.property_media FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete property_media" ON public.property_media FOR DELETE 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- ========== 4. PROPERTY_REVIEWS TABLE ==========
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read property_reviews" ON public.property_reviews;
DROP POLICY IF EXISTS "Allow write property_reviews" ON public.property_reviews;
DROP POLICY IF EXISTS "Allow update property_reviews" ON public.property_reviews;
DROP POLICY IF EXISTS "Allow delete property_reviews" ON public.property_reviews;

CREATE POLICY "Allow read property_reviews" ON public.property_reviews FOR SELECT 
USING (true);

CREATE POLICY "Allow write property_reviews" ON public.property_reviews FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update property_reviews" ON public.property_reviews FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete property_reviews" ON public.property_reviews FOR DELETE 
USING (true);

-- ========== 5. SERVICES TABLE ==========
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read services" ON public.services;
DROP POLICY IF EXISTS "Allow write services" ON public.services;
DROP POLICY IF EXISTS "Allow update services" ON public.services;
DROP POLICY IF EXISTS "Allow delete services" ON public.services;

CREATE POLICY "Allow read services" ON public.services FOR SELECT 
USING (true);

CREATE POLICY "Allow write services" ON public.services FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update services" ON public.services FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete services" ON public.services FOR DELETE 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- ========== 6. MARKETPLACE_ITEMS TABLE ==========
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read marketplace_items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Allow write marketplace_items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Allow update marketplace_items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Allow delete marketplace_items" ON public.marketplace_items;

CREATE POLICY "Allow read marketplace_items" ON public.marketplace_items FOR SELECT 
USING (true);

CREATE POLICY "Allow write marketplace_items" ON public.marketplace_items FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update marketplace_items" ON public.marketplace_items FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete marketplace_items" ON public.marketplace_items FOR DELETE 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
