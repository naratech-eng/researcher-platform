-- Fix infinite recursion in user_roles RLS policies
-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Keep only the simple policy that users can view their own roles
-- This prevents the infinite recursion issue
-- Admin operations should be done through service role key instead