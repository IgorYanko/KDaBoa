/**
 * Tokens de redefinição de senha do modo mock. Como as senhas do mock (mocks/usuarios.ts),
 * ficam só na memória: somem ao recarregar a página. Na API real, o backend guarda
 * o hash do token, com validade de 1 hora e uso único (issue #18).
 */

const VALIDADE_MS = 60 * 60 * 1000;

interface TokenMock {
  email: string;
  expiraEm: number;
  usado: boolean;
}

const tokens = new Map<string, TokenMock>();

/** Cria um token para o e-mail e devolve o valor que iria no link do e-mail. Como na API, invalida os anteriores. */
export function criarTokenSenha(email: string): string {
  for (const registro of tokens.values()) {
    if (registro.email === email) registro.usado = true;
  }
  const token = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('');
  tokens.set(token, { email, expiraEm: Date.now() + VALIDADE_MS, usado: false });
  return token;
}

/** Marca o token como usado e devolve o e-mail dele; null se não existe, expirou ou já foi usado. */
export function usarTokenSenha(token: string): string | null {
  const registro = tokens.get(token);
  if (!registro || registro.usado || registro.expiraEm < Date.now()) return null;
  registro.usado = true;
  return registro.email;
}
