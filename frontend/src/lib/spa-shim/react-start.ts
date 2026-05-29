// SPA shim for @tanstack/react-start
// Converts server-function declarations into plain client-side async functions
// that call Supabase directly using the authenticated browser session.
//
// All server-only APIs (middleware, createStart) become no-ops.

import { supabase } from "@/integrations/supabase/client";

type Validator = (input: unknown) => unknown | Promise<unknown>;
type Handler = (args: { data: any; context: any }) => any | Promise<any>;

class ServerFnBuilder {
  private _validator?: Validator;

  middleware(_mws: unknown): this {
    return this;
  }

  inputValidator(v: Validator): this {
    this._validator = v;
    return this;
  }

  handler<R>(h: Handler): (opts?: { data?: unknown }) => Promise<R> {
    const validator = this._validator;
    const fn = async (opts?: { data?: unknown }): Promise<R> => {
      const raw = opts?.data;
      const data = validator ? await validator(raw) : raw;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user ?? null;
      const context = {
        supabase,
        userId: user?.id ?? null,
        claims: user ? { sub: user.id, email: user.email } : null,
      };
      return (await h({ data, context })) as R;
    };
    return fn;
  }
}

export function createServerFn(_opts?: { method?: string }): any {
  return new ServerFnBuilder();
}

export function useServerFn<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

// `.middleware([...])` style — accepts client/server hooks but never runs them in SPA.
export function createMiddleware(_opts?: unknown): any {
  const noop = () => ({ server: noop, client: noop });
  return { server: noop, client: noop };
}

export function createStart(_factory: unknown): any {
  return {};
}
