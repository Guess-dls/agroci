-- Fix Critical Security Issues

-- 1. Create app_role enum for proper role management
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'producteur', 'acheteur');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Migrate existing user_type data to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, user_type::text::app_role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Update get_user_type function to use new roles table
CREATE OR REPLACE FUNCTION public.get_user_type()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- 7. Fix producer contact exposure - require authentication
DROP POLICY IF EXISTS "public_producer_info_select" ON public.profiles;

CREATE POLICY "authenticated_producer_info_select"
ON public.profiles
FOR SELECT
USING (
  (user_type = 'producteur'::user_type) 
  AND (verified = true) 
  AND (auth.role() = 'authenticated'::text)
);

-- 8. Add reference uniqueness check for payment security
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_reference_unique 
ON public.transactions (reference_paiement) 
WHERE reference_paiement IS NOT NULL;