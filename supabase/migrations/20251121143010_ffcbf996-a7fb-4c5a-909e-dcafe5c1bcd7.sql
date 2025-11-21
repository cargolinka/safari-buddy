-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Recreate the policy using the has_role security definer function
-- This prevents infinite recursion because has_role() is SECURITY DEFINER
-- and bypasses RLS policies
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));