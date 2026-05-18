
-- Simplify products UPDATE policy and enforce immutable fields via trigger
DROP POLICY IF EXISTS "Producers can update own products" ON public.products;

CREATE POLICY "Producers can update own products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = products.producteur_id
      AND profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = products.producteur_id
      AND profiles.user_id = auth.uid()
  )
);

-- Trigger function: prevent non-admin users from changing sensitive fields
CREATE OR REPLACE FUNCTION public.products_protect_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can change anything
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change status, hidden, producteur_id
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status := OLD.status;
  END IF;
  IF NEW.hidden IS DISTINCT FROM OLD.hidden THEN
    NEW.hidden := OLD.hidden;
  END IF;
  IF NEW.producteur_id IS DISTINCT FROM OLD.producteur_id THEN
    NEW.producteur_id := OLD.producteur_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_protect_sensitive_fields_trg ON public.products;
CREATE TRIGGER products_protect_sensitive_fields_trg
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.products_protect_sensitive_fields();
