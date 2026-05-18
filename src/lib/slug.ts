// Utilitário para tratar URLs amigáveis (slug) ou UUIDs como identificadores
// equivalentes. Mantém compatibilidade com links antigos baseados em UUID.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  return !!value && UUID_RE.test(value);
}

/**
 * Retorna `{ id }` se o valor parece um UUID, senão `{ slug }`.
 * Útil para encadear .eq() condicional em queries Supabase.
 */
export function idOrSlugFilter(value: string): { id: string } | { slug: string } {
  return isUuid(value) ? { id: value } : { slug: value };
}

/**
 * Escolhe o melhor segmento para URLs: prefere o slug se existir.
 */
export function pickRouteParam(item: { id: string; slug?: string | null }): string {
  return item.slug && item.slug.length > 0 ? item.slug : item.id;
}
