import { createContext, type ReactNode, useCallback, useMemo, useState } from 'react';
import { limparSessao, lerSessao, type Sessao, salvarSessao } from '../api/sessao';
import type { LoginRequestDTO, UsuarioResumoDTO } from '../dtos';
import { login } from '../services/auth';

export interface AuthContextValor {
  usuario: UsuarioResumoDTO | null;
  logado: boolean;
  /** Faz login e guarda a sessão. Lança ErroApi se falhar. */
  entrar: (dados: LoginRequestDTO) => Promise<void>;
  /** Limpa a sessão (o redirecionamento para /login é feito pelas rotas privadas). */
  sair: () => void;
}

export const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao());

  const entrar = useCallback(async (dados: LoginRequestDTO) => {
    const resposta = await login(dados);
    const nova: Sessao = { token: resposta.token, usuario: resposta.usuario };
    salvarSessao(nova);
    setSessao(nova);
  }, []);

  const sair = useCallback(() => {
    limparSessao();
    setSessao(null);
  }, []);

  const valor = useMemo<AuthContextValor>(
    () => ({ usuario: sessao?.usuario ?? null, logado: sessao !== null, entrar, sair }),
    [sessao, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
