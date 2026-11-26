import type { EventoDTO, UsuarioResumoDTO } from '../dtos';

/**
 * Quem pode editar e excluir um evento: quem criou ou um ADMIN.
 * O backend confere a mesma regra (responde 403); aqui só decide se mostra os botões.
 */
export function podeGerenciarEvento(evento: EventoDTO, usuario: UsuarioResumoDTO | null): boolean {
  if (!usuario) return false;
  return evento.criador_id === usuario.id || usuario.perfil === 'ADMIN';
}

export function ehAdmin(usuario: UsuarioResumoDTO | null): boolean {
  return usuario?.perfil === 'ADMIN';
}
