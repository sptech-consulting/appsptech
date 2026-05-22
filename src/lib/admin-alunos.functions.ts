// Wrappers cliente para a Edge Function `admin-alunos`.
import { supabase } from "@/integrations/supabase/client";

async function call<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-alunos", {
    body: { action, ...payload },
  });
  if (error) {
    const ctx: any = (error as any).context;
    let msg = error.message;
    try {
      if (ctx && typeof ctx.json === "function") {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      }
    } catch {}
    throw new Error(msg);
  }
  if (data && typeof data === "object" && "error" in data && (data as any).error) {
    throw new Error((data as any).error);
  }
  return data as T;
}

export async function definirSenhaTempAluno(params: { aluno_id: string; senha: string }) {
  return call<{ ok: true; auth_user_id: string }>("setTempPassword", params);
}
