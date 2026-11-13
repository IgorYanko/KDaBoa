import type { EventoDTO, UsuarioResumoDTO } from '../dtos';

/**
 * Eventos do esboço (frame 3). As datas são relativas a hoje para os filtros
 * "Hoje", "Fim de semana" e "Este mês" sempre terem algo para mostrar.
 * `total_confirmados` conta as outras pessoas; a presença do usuário logado
 * fica em mocks/presencas.ts.
 */

/** Data daqui a `dias` dias, na hora indicada, em ISO. */
function emDias(dias: number, horas: number, minutos = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(horas, minutos, 0, 0);
  return d.toISOString();
}

/** Próxima ocorrência do dia da semana (0 = domingo), contando hoje. */
function proximo(diaSemana: number): number {
  return (diaSemana - new Date().getDay() + 7) % 7;
}

const pessoas: UsuarioResumoDTO[] = [
  { id: 'u-ana', nome: 'Ana Souza', apelido: 'anasouza' },
  { id: 'u-bruno', nome: 'Bruno Lima', apelido: 'brunolima' },
  { id: 'u-carla', nome: 'Carla Mendes', apelido: 'carlam' },
  { id: 'u-diego', nome: 'Diego Rocha', apelido: 'diegor' },
];

const coletivo: UsuarioResumoDTO = { id: 'u-coletivo', nome: 'Coletivo Som Local' };

export const eventosMock: EventoDTO[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    titulo: 'Noite de rock autoral',
    descricao: 'Bandas autorais da região tocando a noite toda. Abertura da casa às 20h, primeira banda às 21h.',
    data_inicio: emDias(proximo(5), 21),
    data_fim: emDias(proximo(5) + 1, 2),
    preco: 0,
    classificacao_etaria: 16,
    categoria_id: 1,
    local_id: 1,
    criador_id: coletivo.id,
    organizador: coletivo,
    total_confirmados: 23,
    eu_vou: false,
    participantes_amostra: pessoas,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    titulo: 'Sarau na praça',
    descricao: 'Evento cultural aberto ao público, com poesia, música acústica e microfone aberto.',
    data_inicio: emDias(proximo(6), 18),
    data_fim: emDias(proximo(6), 22),
    preco: 0,
    classificacao_etaria: 0,
    categoria_id: 3,
    local_id: 2,
    criador_id: 'u-cultura',
    organizador: { id: 'u-cultura', nome: 'Secretaria de Cultura' },
    total_confirmados: 41,
    eu_vou: false,
    participantes_amostra: pessoas.slice(0, 3),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    titulo: 'Festa universitária',
    descricao: 'A festa mais esperada do semestre, com DJs convidados e open bar até a meia-noite.',
    data_inicio: emDias(proximo(6), 23),
    data_fim: emDias(proximo(6) + 1, 5),
    preco: 40,
    classificacao_etaria: 18,
    categoria_id: 2,
    local_id: 3,
    criador_id: 'u-atletica',
    organizador: { id: 'u-atletica', nome: 'Atlética Univás' },
    total_confirmados: 87,
    eu_vou: false,
    participantes_amostra: pessoas,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    titulo: 'Feira gastronômica',
    descricao: 'Food trucks, cervejas artesanais e música ao vivo para a família toda.',
    data_inicio: emDias(proximo(0), 11),
    data_fim: emDias(proximo(0), 18),
    preco: 0,
    classificacao_etaria: 0,
    categoria_id: 5,
    local_id: 4,
    criador_id: 'u-feira',
    organizador: { id: 'u-feira', nome: 'Feira Sabores do Sul' },
    total_confirmados: 56,
    eu_vou: false,
    participantes_amostra: pessoas.slice(1),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    titulo: 'Corrida noturna 5 km',
    descricao: 'Corrida e caminhada noturna pela avenida principal. Inscrição no local.',
    data_inicio: emDias(proximo(3) || 7, 19, 30),
    data_fim: emDias(proximo(3) || 7, 21),
    preco: 25,
    classificacao_etaria: 0,
    categoria_id: 4,
    local_id: 5,
    criador_id: 'u-corre',
    organizador: { id: 'u-corre', nome: 'Corre Pouso Alegre' },
    total_confirmados: 18,
    eu_vou: false,
    participantes_amostra: pessoas.slice(0, 3),
  },
];
