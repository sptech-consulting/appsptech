/**
 * Política de senha forte.
 * Mínimo 8 chars, ao menos 1 letra, 1 número e 1 caractere especial OU letra maiúscula.
 * Mensagens em PT-BR para uso em formulários.
 */
export function validarSenhaForte(senha: string): string | null {
  if (!senha) return "Informe uma senha.";
  if (senha.length < 8) return "A senha deve ter ao menos 8 caracteres.";
  if (senha.length > 72) return "A senha deve ter no máximo 72 caracteres.";
  if (!/[a-z]/.test(senha)) return "A senha deve conter ao menos uma letra minúscula.";
  if (!/[A-Z0-9!@#$%^&*()_\-+=[\]{};:,.<>?/\\|`~"']/.test(senha))
    return "A senha deve conter ao menos uma letra maiúscula, número ou símbolo.";
  if (!/\d/.test(senha) && !/[!@#$%^&*()_\-+=[\]{};:,.<>?/\\|`~"']/.test(senha))
    return "A senha deve conter ao menos um número ou símbolo.";
  // padrões fracos óbvios
  if (/^(.)\1+$/.test(senha)) return "Senha muito fraca.";
  return null;
}

/** Pontuação simples 0..4 para barra de força. */
export function forcaSenha(senha: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (senha.length >= 8) score++;
  if (senha.length >= 12) score++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) score++;
  if (/\d/.test(senha) && /[!@#$%^&*()_\-+=[\]{};:,.<>?/\\|`~"']/.test(senha)) score++;
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}
