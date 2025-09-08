-- Créer les politiques RLS pour le bucket product-images
CREATE POLICY IF NOT EXISTS "Public access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can delete their own product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);