import type { EventoDTO, UsuarioResumoDTO } from '../dtos';

/**
 * Pessoas do modo mock que deixaram a presença visível (tela Quem vai, frame 5).
 * As quatro primeiras são as mesmas das bolinhas dos cards (mocks/eventos.ts).
 */
export const pessoasVisiveisMock: UsuarioResumoDTO[] = [
  { id: 'u-ana', nome: 'Ana Souza', apelido: 'anasouza' },
  { id: 'u-bruno', nome: 'Bruno Lima', apelido: 'brunolima' },
  { id: 'u-carla', nome: 'Carla Mendes', apelido: 'carlam' },
  { id: 'u-diego', nome: 'Diego Rocha', apelido: 'diegor' },
  { id: 'u-elisa', nome: 'Elisa Prado', apelido: 'elisaprado' },
  { id: 'u-felipe', nome: 'Felipe Nunes', apelido: 'fnunes' },
  { id: 'u-gabi', nome: 'Gabi Torres', apelido: 'gabitorres' },
  { id: 'u-henrique', nome: 'Henrique Alves', apelido: 'henrique.a' },
  { id: 'u-isabela', nome: 'Isabela Costa', apelido: 'isacosta' },
  { id: 'u-julia', nome: 'Júlia Ramos', apelido: 'juramos' },
];

/**
 * Quem aparece no Quem vai de um evento do mock: as pessoas da amostra do card primeiro,
 * depois as outras, até o total de confirmados (`total_confirmados` do mock conta só os outros).
 * Quem passar disso conta como presença oculta.
 */
export function visiveisNoEvento(evento: EventoDTO): UsuarioResumoDTO[] {
  const amostra = evento.participantes_amostra ?? [];
  const resto = pessoasVisiveisMock.filter((p) => !amostra.some((a) => a.id === p.id));
  const total = Math.min(evento.total_confirmados ?? 0, pessoasVisiveisMock.length);
  return [...amostra, ...resto].slice(0, total);
}
