import type { UsuarioResumoDTO } from '../dtos';
import type { NomeIcone } from './Icone';

interface ItemNavegacao {
  para: string;
  rotulo: string;
  icone: NomeIcone;
  /** Só aparece para o perfil ADMIN. */
  soAdmin?: boolean;
}

/** Destinos da navegação principal (barra inferior no celular e barra do topo no desktop). */
const itens: ItemNavegacao[] = [
  { para: '/inicio', rotulo: 'Início', icone: 'inicio' },
  { para: '/agenda', rotulo: 'Agenda', icone: 'agenda' },
  { para: '/conversas', rotulo: 'Conversas', icone: 'chat' },
  { para: '/perfil', rotulo: 'Perfil', icone: 'perfil' },
  { para: '/admin', rotulo: 'Admin', icone: 'cadeado', soAdmin: true },
];

/** Itens que essa pessoa vê (o "Admin" só para administradores). */
export function itensNavegacao(usuario: UsuarioResumoDTO | null): ItemNavegacao[] {
  return itens.filter((item) => !item.soAdmin || usuario?.perfil === 'ADMIN');
}
