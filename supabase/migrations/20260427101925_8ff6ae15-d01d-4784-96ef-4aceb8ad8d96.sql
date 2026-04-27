
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- 2. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  m_payment_id text NOT NULL UNIQUE,
  pf_payment_id text,
  amount numeric(10,2) NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('program','subscription')),
  item_id uuid,
  plan text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','complete','failed','cancelled')),
  mode text NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox','live')),
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Note: no INSERT/UPDATE policies => only service role (server) can write.

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Payment settings (single row controlled by admins)
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  payfast_mode text NOT NULL DEFAULT 'sandbox' CHECK (payfast_mode IN ('sandbox','live')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.payment_settings (id, payfast_mode)
VALUES (true, 'sandbox')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read payment settings"
  ON public.payment_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update payment settings"
  ON public.payment_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
