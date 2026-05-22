// SPA shim: there is no service-role client in the browser.
// All calls that previously used `supabaseAdmin` now use the browser client
// (RLS applies as the signed-in user). Admin-only operations that require
// service role must be moved to a Supabase Edge Function.
export { supabase as supabaseAdmin } from "@/integrations/supabase/client";
