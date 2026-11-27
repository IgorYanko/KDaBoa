import type { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getLocais = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locais = await prisma.local.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(locais);
  } catch (_error) {
    res.status(500).json({ erro: 'Erro ao buscar locais' });
  }
};

/** Texto opcional: vazio vira null; com algo, sem espaços nas pontas. */
function textoOuNulo(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

/** Número opcional (latitude/longitude): vazio vira null. */
function numeroOuNulo(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/** Campos do local vindos do corpo; devolve a mensagem de erro se faltar o obrigatório. */
function dadosDoLocal(corpo: Record<string, unknown> | undefined) {
  const nome = textoOuNulo(corpo?.nome);
  const endereco = textoOuNulo(corpo?.endereco);
  if (!nome) return { erro: 'Dê um nome ao local.' };
  if (!endereco) return { erro: 'Informe o endereço.' };
  if (nome.length > 120) return { erro: 'O nome pode ter até 120 caracteres.' };
  if (endereco.length > 200) return { erro: 'O endereço pode ter até 200 caracteres.' };
  return {
    dados: {
      nome,
      endereco,
      cep: textoOuNulo(corpo?.cep),
      bairro: textoOuNulo(corpo?.bairro),
      latitude: numeroOuNulo(corpo?.latitude),
      longitude: numeroOuNulo(corpo?.longitude),
    },
  };
}

function idDoLocal(req: Request): number | null {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** POST /api/locais (só ADMIN) */
export const criarLocal = async (req: Request, res: Response): Promise<void> => {
  const { dados, erro } = dadosDoLocal(req.body);
  if (!dados) {
    res.status(400).json({ erro });
    return;
  }
  try {
    const novoLocal = await prisma.local.create({ data: dados });
    res.status(201).json(novoLocal);
  } catch (_error) {
    res.status(400).json({ erro: 'Erro ao criar local' });
  }
};

/** PUT /api/locais/:id (só ADMIN) */
export const atualizarLocal = async (req: Request, res: Response): Promise<void> => {
  const id = idDoLocal(req);
  if (!id) {
    res.status(404).json({ erro: 'Local não encontrado' });
    return;
  }
  const { dados, erro } = dadosDoLocal(req.body);
  if (!dados) {
    res.status(400).json({ erro });
    return;
  }
  try {
    const existente = await prisma.local.findUnique({ where: { id } });
    if (!existente) {
      res.status(404).json({ erro: 'Local não encontrado' });
      return;
    }
    // Sem coordenadas no corpo, mantém as que já existem (a tela de admin não edita o mapa).
    const atualizado = await prisma.local.update({
      where: { id },
      data: {
        ...dados,
        latitude: dados.latitude ?? existente.latitude,
        longitude: dados.longitude ?? existente.longitude,
      },
    });
    res.json(atualizado);
  } catch (_error) {
    res.status(500).json({ erro: 'Erro ao atualizar local' });
  }
};

/** DELETE /api/locais/:id (só ADMIN). Local com eventos não sai (o banco também não deixa). */
export const excluirLocal = async (req: Request, res: Response): Promise<void> => {
  const id = idDoLocal(req);
  if (!id) {
    res.status(404).json({ erro: 'Local não encontrado' });
    return;
  }
  try {
    const existente = await prisma.local.findUnique({ where: { id } });
    if (!existente) {
      res.status(404).json({ erro: 'Local não encontrado' });
      return;
    }
    const emUso = await prisma.evento.count({ where: { localId: id } });
    if (emUso > 0) {
      const eventos = emUso === 1 ? 'evento' : 'eventos';
      const deles = emUso === 1 ? 'dele' : 'deles';
      res.status(409).json({ erro: `Este local tem ${emUso} ${eventos}. Troque o local ${deles} antes de excluir.` });
      return;
    }
    await prisma.local.delete({ where: { id } });
    res.json({ mensagem: 'Local excluído' });
  } catch (_error) {
    res.status(500).json({ erro: 'Erro ao excluir local' });
  }
};
