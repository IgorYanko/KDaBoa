import type { MensagemChatDTO, UsuarioResumoDTO } from '../dtos';

/**
 * Mensagens do chat no modo mock. Cada evento começa com uma conversa de exemplo
 * (a do esboço); o que o usuário envia fica guardado no navegador, por evento.
 * No modo API quem guarda é o backend (socket.io, issue #34).
 */

const ana: UsuarioResumoDTO = { id: 'u-ana', nome: 'Ana Souza', apelido: 'anasouza' };
const bruno: UsuarioResumoDTO = { id: 'u-bruno', nome: 'Bruno Lima', apelido: 'brunolima' };
const carla: UsuarioResumoDTO = { id: 'u-carla', nome: 'Carla Mendes', apelido: 'carlam' };
const diego: UsuarioResumoDTO = { id: 'u-diego', nome: 'Diego Rocha', apelido: 'diegor' };

/** Quem responde automaticamente no mock depois que o usuário manda mensagem. */
export const pessoasDoChatMock = [ana, bruno, carla, diego];

export const respostasMock = [
  'Boa! Te vejo lá então.',
  'Fechou! Chego um pouco antes.',
  'Alguém quer dividir um carro?',
  'Show, bora!',
];

/** Horário de hoje (ou de ontem, se ainda não passou) para a conversa de exemplo. */
function hojeAs(horas: number, minutos: number): string {
  const d = new Date();
  d.setHours(horas, minutos, 0, 0);
  if (d > new Date()) d.setDate(d.getDate() - 1);
  return d.toISOString();
}

function conversaDeExemplo(eventoId: string): MensagemChatDTO[] {
  const linhas: [UsuarioResumoDTO, string, number, number][] = [
    [bruno, 'Alguém vai chegar cedo? Bora pegar mesa', 20, 14],
    [ana, 'Eu chego umas 20h30', 20, 16],
    [ana, 'Guardo lugar pra quem chegar depois', 20, 16],
    [carla, 'Vou com mais duas amigas', 20, 18],
    [diego, 'Alguém sabe se tem estacionamento perto?', 20, 22],
  ];
  return linhas.map(([autor, texto, h, m], i) => ({
    id: `${eventoId}-exemplo-${i}`,
    evento_id: eventoId,
    autor,
    texto,
    criado_em: hojeAs(h, m),
  }));
}

function chave(eventoId: string): string {
  return `kdaboa:mock:mensagens:${eventoId}`;
}

/** Conversa do evento: a de exemplo + as enviadas neste navegador. */
export function lerMensagens(eventoId: string): MensagemChatDTO[] {
  let enviadas: MensagemChatDTO[] = [];
  try {
    enviadas = JSON.parse(localStorage.getItem(chave(eventoId)) ?? '[]') as MensagemChatDTO[];
  } catch {
    enviadas = [];
  }
  return [...conversaDeExemplo(eventoId), ...enviadas].sort((a, b) => a.criado_em.localeCompare(b.criado_em));
}

export function salvarMensagem(mensagem: MensagemChatDTO): void {
  const atuais = lerMensagens(mensagem.evento_id).filter((m) => !m.id.includes('-exemplo-'));
  localStorage.setItem(chave(mensagem.evento_id), JSON.stringify([...atuais, mensagem]));
}
