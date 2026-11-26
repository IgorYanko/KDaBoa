import type { UsuarioDTO } from '../dtos';

/**
 * Usuários do modo mock, um por perfil:
 *   kayo@email.com / senha123   (USUARIO)
 *   admin@email.com / admin123  (ADMIN: edita e exclui qualquer evento)
 */
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
    perfil: 'USUARIO',
  },
  {
    id: '0b9f6c2e-7a41-4d8e-9c3a-5e2f1a7b8c90',
    nome: 'Admin KdABoa',
    apelido: 'admin',
    email: 'admin@email.com',
    data_nascimento: '1995-01-01',
    interesses: [1, 2, 3],
    mostrar_presenca: false,
    receber_lembretes: false,
    foto_url: null,
    perfil: 'ADMIN',
  },
];

/**
 * Senhas do modo mock, por e-mail. Ficam só na memória (somem ao recarregar a
 * página) e nunca são gravadas no navegador. Na API real, quem guarda e confere
 * a senha (com hash) é o backend.
 */
export const senhasMock = new Map<string, string>([
  ['kayo@email.com', 'senha123'],
  ['admin@email.com', 'admin123'],
]);
