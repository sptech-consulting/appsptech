// SPA shim: requireSupabaseAuth is consumed by createServerFn().middleware([...])
// in the shim it's a marker, never executed. The shim's handler reads the
// current Supabase user directly.
export const requireSupabaseAuth: any = { __spaShim: "requireSupabaseAuth" };
