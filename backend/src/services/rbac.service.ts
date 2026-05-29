import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "../db/connection.js";
import {
  grupoPermissoes,
  gruposAcesso,
  permissoes,
  usuariosAdmin,
  usuariosAdminGrupos,
} from "../db/schema/index.js";

export async function adminHasPermission(
  adminId: string,
  chave: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: permissoes.id })
    .from(usuariosAdminGrupos)
    .innerJoin(grupoPermissoes, eq(grupoPermissoes.grupoId, usuariosAdminGrupos.grupoId))
    .innerJoin(permissoes, eq(permissoes.id, grupoPermissoes.permissaoId))
    .where(
      and(
        eq(usuariosAdminGrupos.usuarioAdminId, adminId),
        eq(permissoes.chave, chave),
        or(eq(usuariosAdminGrupos.acessoGlobal, true)),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/** Checks if a (usuario_admin_id, grupo_id, ambiente_id) combination already exists.
 *  Replaces the partial unique index that MySQL doesn't support.
 */
export async function vinculoGrupoExists(
  usuarioAdminId: string,
  grupoId: string,
  ambienteId: string | null,
): Promise<boolean> {
  const rows = await db
    .select({ id: usuariosAdminGrupos.id })
    .from(usuariosAdminGrupos)
    .where(
      and(
        eq(usuariosAdminGrupos.usuarioAdminId, usuarioAdminId),
        eq(usuariosAdminGrupos.grupoId, grupoId),
        ambienteId
          ? eq(usuariosAdminGrupos.ambienteId, ambienteId)
          : isNull(usuariosAdminGrupos.ambienteId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/** Returns true if this admin is the only active Super Admin with global access. */
export async function isLastSuperAdmin(adminId: string): Promise<boolean> {
  const [superAdminGroup] = await db
    .select({ id: gruposAcesso.id })
    .from(gruposAcesso)
    .where(and(eq(gruposAcesso.nome, "Super Admin"), eq(gruposAcesso.escopo, "global")))
    .limit(1);

  if (!superAdminGroup) return false;

  const superAdmins = await db
    .select({ id: usuariosAdmin.id })
    .from(usuariosAdminGrupos)
    .innerJoin(usuariosAdmin, eq(usuariosAdmin.id, usuariosAdminGrupos.usuarioAdminId))
    .where(
      and(
        eq(usuariosAdminGrupos.grupoId, superAdminGroup.id),
        eq(usuariosAdminGrupos.acessoGlobal, true),
        eq(usuariosAdmin.status, "ativo"),
      ),
    );

  return superAdmins.length === 1 && superAdmins[0]?.id === adminId;
}
