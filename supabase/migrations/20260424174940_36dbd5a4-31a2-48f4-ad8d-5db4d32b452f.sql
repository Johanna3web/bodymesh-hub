
DROP POLICY IF EXISTS "Avatars listable by authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Community media listable by authenticated" ON storage.objects;

-- Listing only allowed for owner's folder. Direct file URLs still work because buckets are public.
CREATE POLICY "Users list own avatar folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users list own community folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'community'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
