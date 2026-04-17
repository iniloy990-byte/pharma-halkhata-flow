ALTER TABLE public.pharmacy_settings ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';

INSERT INTO storage.buckets (id, name, public)
VALUES ('pharmacy-logos', 'pharmacy-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read pharmacy logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'pharmacy-logos');

CREATE POLICY "Anyone can upload pharmacy logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pharmacy-logos');

CREATE POLICY "Anyone can update pharmacy logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pharmacy-logos');

CREATE POLICY "Anyone can delete pharmacy logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'pharmacy-logos');