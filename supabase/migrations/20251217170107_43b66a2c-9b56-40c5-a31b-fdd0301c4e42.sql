-- RLS policy for email verification tokens - only service role can access
CREATE POLICY "Service role can manage verification tokens"
ON public.email_verification_tokens
FOR ALL
USING (true)
WITH CHECK (true);