
-- Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  due_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);

-- Company purchases table
CREATE TABLE public.company_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_no text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  due_amount numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access company_purchases" ON public.company_purchases FOR ALL USING (true) WITH CHECK (true);

-- Company payments table
CREATE TABLE public.company_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'Cash',
  date timestamptz NOT NULL DEFAULT now(),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access company_payments" ON public.company_payments FOR ALL USING (true) WITH CHECK (true);
