import type { UsuarioResumoDTO } from '../dtos';

/** Sessão guardada no navegador depois do login. */
export interface Sessao {
  token: string;
  usuario: UsuarioResumoDTO;
}

const CHAVE = 'kdaboa:sessao';

export function lerSessao(): Sessao | null {
  try {
    const texto = localStorage.getItem(CHAVE);
    return texto ? (JSON.parse(texto) as Sessao) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: Sessao): void {
  localStorage.setItem(CHAVE, JSON.stringify(sessao));
}

export function limparSessao(): void {
  localStorage.removeItem(CHAVE);
}
