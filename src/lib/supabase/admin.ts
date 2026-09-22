import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Never imported into anything that ships to the
 * browser — only used in a couple of server route handlers that
 * authenticate by a capability token instead of a user session
 * (the public /api/profile?token= read, and the external-sync inbound
 * endpoint). RLS is bypassed here, so every caller of this client is
 * responsible for checking the token itself before touching data.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}
