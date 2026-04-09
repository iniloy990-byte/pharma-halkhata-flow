
CREATE TABLE public.due_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.due_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access due_entries" ON public.due_entries FOR ALL USING (true) WITH CHECK (true);
