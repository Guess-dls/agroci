-- Créer les politiques RLS pour le bucket product-images
-- Si elles existent déjà, les commandes échoueront silencieusement

DO $$
BEGIN
    -- Politique pour voir les images (public)
    BEGIN
        CREATE POLICY "Public access to product images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'product-images');
    EXCEPTION WHEN duplicate_object THEN
        -- La politique existe déjà, on l'ignore
        NULL;
    END;

    -- Politique pour uploader des images (utilisateurs authentifiés seulement)
    BEGIN
        CREATE POLICY "Authenticated users can upload product images"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'product-images' 
            AND auth.role() = 'authenticated'
        );
    EXCEPTION WHEN duplicate_object THEN
        -- La politique existe déjà, on l'ignore
        NULL;
    END;

    -- Politique pour supprimer ses propres images
    BEGIN
        CREATE POLICY "Users can delete their own product images"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'product-images' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    EXCEPTION WHEN duplicate_object THEN
        -- La politique existe déjà, on l'ignore
        NULL;
    END;
END $$;