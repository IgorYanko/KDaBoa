import type { NomeIcone } from './Icone';

/** Destinos da navegação principal (barra inferior no celular e barra do topo no desktop). */
export const itensNavegacao: { para: string; rotulo: string; icone: NomeIcone }[] = [
  { para: '/inicio', rotulo: 'Início', icone: 'inicio' },
  { para: '/agenda', rotulo: 'Agenda', icone: 'agenda' },
  { para: '/conversas', rotulo: 'Conversas', icone: 'chat' },
  { para: '/perfil', rotulo: 'Perfil', icone: 'perfil' },
];
