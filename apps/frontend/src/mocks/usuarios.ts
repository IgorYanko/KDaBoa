import type { UsuarioDTO } from '../dtos';

/** Usuários do modo mock. Teste: kayo@email.com com a senha "senha123". */
export const usuariosMock: UsuarioDTO[] = [
  {
    id: '987fcdeb-51a2-43d7-9012-345678901234',
    nome: 'Kayo Winicius',
    apelido: 'kayow',
    email: 'kayo@email.com',
    data_nascimento: '2000-01-01',
    interesses: [1, 2],
    mostrar_presenca: false,
    receber_lembretes: true,
    foto_url: null,
  },
];

/**
 * Senhas do modo mock, por e-mail. Ficam só na memória (somem ao recarregar a
 * página) e nunca são gravadas no navegador. Na API real, quem guarda e confere
 * a senha (com hash) é o backend.
 */
export const senhasMock = new Map<string, string>([['kayo@email.com', 'senha123']]);
