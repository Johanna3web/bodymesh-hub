
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- Tighten public bucket listing — allow direct file access by URL (works because buckets are public),
-- but require auth to list/scan the bucket via the API.
DROP POLICY IF EXISTS "Public avatar read" ON storage.objects;
DROP POLICY IF EXISTS "Public community media read" ON storage.objects;

CREATE POLICY "Avatars listable by authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Community media listable by authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'community');
