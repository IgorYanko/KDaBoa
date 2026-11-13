import type { UsuarioDTO } from '../dtos';

/** Usuário de teste: entra com kayo@email.com e qualquer senha (igual ao mock do backend). */
export const usuariosMock: UsuarioDTO[] = [
  {
    id: '987fcdeb-51a2-43d7-9012-345678901234',
    nome: 'Kayo Winicius',
    apelido: 'kayow',
    email: 'kayo@email.com',
    data_nascimento: '2000-01-01',
    interesses: [1, 2],
    mostrar_presenca: true,
    receber_lembretes: true,
    foto_url: null,
  },
];
