import { useContext } from 'react';
import { AuthContext, type AuthContextValor } from './AuthContext';

/** Acesso à sessão do usuário. Use dentro do <AuthProvider>. */
export function useAuth(): AuthContextValor {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return contexto;
}
