-- Company user profile: job title / role label (not auth role enum)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS position text;

-- Signup / admin-created auth users: persist optional position into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, company_id, full_name, role, position)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'company_id')::uuid,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')::user_role,
    NULLIF(trim(NEW.raw_user_meta_data->>'position'), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins may update any user row in their company (e.g. is_active, position)
CREATE POLICY "admin update company users"
  ON public.users
  FOR UPDATE
  USING (
    company_id = public.get_my_company_id()
    AND public.is_admin()
  )
  WITH CHECK (company_id = public.get_my_company_id());

-- List company users with email (auth.users) for HR admin UI only
CREATE OR REPLACE FUNCTION public.admin_list_company_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  is_active boolean,
  job_position text,
  role user_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    u.id,
    au.email::text,
    u.full_name,
    u.is_active,
    u.position AS job_position,
    u.role
  FROM public.users u
  JOIN auth.users au ON au.id = u.id
  WHERE u.company_id = public.get_my_company_id()
    AND public.is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_company_users() TO authenticated;
