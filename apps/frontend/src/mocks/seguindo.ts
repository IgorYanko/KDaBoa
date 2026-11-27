import { lerSessao } from '../api/sessao';

/**
 * Quem o usuário logado segue no modo mock, guardado no navegador por usuário.
 * No modo API quem guarda é o backend (issue #31).
 */

function chave(): string {
  return `kdaboa:mock:seguindo:${lerSessao()?.usuario.id ?? 'anonimo'}`;
}

/** O usuário de teste (kayo@email.com) já começa seguindo o Bruno, como no Figma. */
const SEGUINDO_INICIAL: Record<string, string[]> = {
  '987fcdeb-51a2-43d7-9012-345678901234': ['u-bruno'],
};

export function lerSeguindo(): Set<string> {
  try {
    const salvos = localStorage.getItem(chave());
    if (salvos === null) return new Set(SEGUINDO_INICIAL[lerSessao()?.usuario.id ?? ''] ?? []);
    return new Set(JSON.parse(salvos) as string[]);
  } catch {
    return new Set();
  }
}

export function marcarSeguindo(usuarioId: string, seguir: boolean): void {
  const seguindo = lerSeguindo();
  if (seguir) seguindo.add(usuarioId);
  else seguindo.delete(usuarioId);
  localStorage.setItem(chave(), JSON.stringify([...seguindo]));
}
