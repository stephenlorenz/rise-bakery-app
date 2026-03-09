-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  description    TEXT,
  price_cents    INTEGER NOT NULL CHECK (price_cents >= 0),
  image_url      TEXT,
  daily_limit    INTEGER NOT NULL DEFAULT 10 CHECK (daily_limit >= 0),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SCHEDULE CONFIG (recurring weekly)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_config (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week            INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open                BOOLEAN NOT NULL DEFAULT FALSE,
  pickup_start           TIME,
  pickup_end             TIME,
  slot_interval_minutes  INTEGER NOT NULL DEFAULT 15,
  UNIQUE(day_of_week)
);

-- Seed default schedule (Mon–Sat closed by default)
INSERT INTO public.schedule_config (day_of_week, is_open)
VALUES (0, FALSE), (1, FALSE), (2, FALSE), (3, FALSE),
       (4, FALSE), (5, FALSE), (6, FALSE)
ON CONFLICT (day_of_week) DO NOTHING;

-- ─────────────────────────────────────────────
-- SCHEDULE OVERRIDES (specific dates)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date          DATE NOT NULL UNIQUE,
  is_open       BOOLEAN NOT NULL,
  pickup_start  TIME,
  pickup_end    TIME,
  note          TEXT
);

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  pickup_date               DATE NOT NULL,
  pickup_time               TIME NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending_payment'
                              CHECK (status IN ('pending_payment','confirmed','ready','completed','cancelled')),
  stripe_payment_intent_id  TEXT,
  total_cents               INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "Users read own profile"   ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin reads all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());

-- products (public read active; admin full CRUD)
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admin insert products"       ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update products"       ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete products"       ON public.products FOR DELETE USING (public.is_admin());

-- schedule_config
CREATE POLICY "Public read schedule"     ON public.schedule_config FOR SELECT USING (TRUE);
CREATE POLICY "Admin write schedule"     ON public.schedule_config FOR ALL USING (public.is_admin());

-- schedule_overrides
CREATE POLICY "Public read overrides"    ON public.schedule_overrides FOR SELECT USING (TRUE);
CREATE POLICY "Admin write overrides"    ON public.schedule_overrides FOR ALL USING (public.is_admin());

-- orders
CREATE POLICY "Customers see own orders" ON public.orders FOR SELECT USING (customer_id = auth.uid() OR public.is_admin());
CREATE POLICY "Customers insert orders"  ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admin update orders"      ON public.orders FOR UPDATE USING (public.is_admin());

-- order_items
CREATE POLICY "Users see own order items" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );
CREATE POLICY "Users insert order items" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- STORAGE
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admin upload product images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND public.is_admin()
  );

CREATE POLICY "Admin delete product images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'product-images' AND public.is_admin()
  );
