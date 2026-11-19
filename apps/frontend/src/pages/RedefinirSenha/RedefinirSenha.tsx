import { useSearchParams } from 'react-router';
import { NovaSenha } from './NovaSenha';
import { PedirLink } from './PedirLink';

/**
 * Tela 1.1 · Redefinir senha (issue #19).
 * Sem token: pede o e-mail para enviar o link. Com ?token= (o link do e-mail): cria a nova senha.
 */
export function RedefinirSenha() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token');
  // key: um link novo recomeça o formulário do zero.
  return token ? <NovaSenha key={token} token={token} /> : <PedirLink />;
}
