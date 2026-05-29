// Wrappers cliente para a Edge Function `admin-users`.
// Mantemos a mesma assinatura `{ data: ... }` para preservar compatibilidade
// com os call-sites que usam `useServerFn(...)` apenas como passthrough.
import { supabase } from "@/integrations/supabase/client";

async function call<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, ...payload },
  });
  if (error) {
    // Tenta extrair mensagem de erro estruturada do body
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

type InvitePayload = {
  nome: string;
  email: string;
  senha_temporaria?: string;
  grupos: { grupo_id: string; acesso_global: boolean; ambiente_id?: string | null }[];
};

export async function inviteAdminUser({ data }: { data: InvitePayload }) {
  return call<{
    id: string;
    auth_user_id: string;
    reset_link: string | null;
    senha_definida: boolean;
  }>("invite", data);
}

export async function updateAdminUserGroups({
  data,
}: {
  data: {
    usuario_admin_id: string;
    grupos: { grupo_id: string; acesso_global: boolean; ambiente_id?: string | null }[];
  };
}) {
  return call<{ ok: true }>("updateGroups", data);
}

export async function setAdminUserStatus({
  data,
}: {
  data: { usuario_admin_id: string; status: "ativo" | "inativo" };
}) {
  return call<{ ok: true }>("setStatus", data);
}

export async function sendAdminPasswordReset({ data }: { data: { email: string } }) {
  return call<{ reset_link: string | null }>("sendReset", data);
}
