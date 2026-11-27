import { prisma } from '../prisma';
import { enviarEmailLembrete } from './emailService';

function limitesDoDia(referencia: Date): [Date, Date] {
  const inicio = new Date(
    referencia.getFullYear(),
    referencia.getMonth(),
    referencia.getDate(),
  );
  const fim = new Date(
    referencia.getFullYear(),
    referencia.getMonth(),
    referencia.getDate() + 1,
  );
  return [inicio, fim];
}

export async function enviarLembretesEventosDoDia(
  agora = new Date(),
): Promise<{ enviados: number; erros: number }> {
  const [inicioDia, fimDia] = limitesDoDia(agora);

  const presencasPendentes = await prisma.presenca.findMany({
    where: {
      lembreteEnviadoEm: null,
      usuario: {
        lembretesEmail: true,
      },
      evento: {
        dataInicio: {
          gte: inicioDia,
          lt: fimDia,
        },
      },
    },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          lembretesEmail: true,
        },
      },
      evento: {
        include: {
          local: true,
        },
      },
    },
  });

  let enviados = 0;
  let erros = 0;

  for (const presenca of presencasPendentes) {
    try {
      await enviarEmailLembrete(presenca.usuario.email, {
        nomeUsuario: presenca.usuario.nome,
        tituloEvento: presenca.evento.titulo,
        dataInicio: new Date(presenca.evento.dataInicio),
        localNome: presenca.evento.local?.nome,
      });

      await prisma.presenca.update({
        where: {
          usuarioId_eventoId: {
            usuarioId: presenca.usuarioId,
            eventoId: presenca.eventoId,
          },
        },
        data: {
          lembreteEnviadoEm: agora,
        },
      });

      enviados++;
    } catch (_error) {
      erros++;
    }
  }

  return { enviados, erros };
}

export function iniciarAgendadorLembretes(intervaloMs = 15 * 60 * 1000) {
  const executar = () => {
    void enviarLembretesEventosDoDia().catch(() => {
      // Falhas pontuais de SMTP ou banco não derrubam o servidor
    });
  };

  executar();
  return setInterval(executar, intervaloMs);
}