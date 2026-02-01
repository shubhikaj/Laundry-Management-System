import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * In the v0 preview environment env vars are not injected,
 * so we fall back to harmless placeholders.
 * Remember to set:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY  (server-side only)
 * before deploying/using the real API.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key-placeholder"

/**
 * Export a singleton client for client-side usage.
 * If placeholders are used we log a warning once.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

if (supabaseUrl.includes("placeholder") || supabaseAnonKey.includes("placeholder")) {
  // eslint-disable-next-line no-console
  console.warn("[LMS] Supabase env vars missing. Using placeholder keys – set the real values before production.")
}

/**
 * Helper for server actions / route handlers.
 * Uses the service role key, which should never be exposed to the browser.
 */
export const createServerClient = (): SupabaseClient => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "service-role-key-placeholder"

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl, serviceRoleKey)
}
