import type { Request, Response } from 'express';
import { prisma } from '../prisma';

export const NOME_CATEGORIA_MAXIMO = 60;

export const getCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(categorias);
  } catch (_error) {
    res.status(500).json({ erro: 'Erro ao buscar categorias' });
  }
};

function nomeDaCategoria(corpo: Record<string, unknown> | undefined): { nome?: string; erro?: string } {
  const nome = typeof corpo?.nome === 'string' ? corpo.nome.trim() : '';
  if (!nome) return { erro: 'Dê um nome à categoria.' };
  if (nome.length > NOME_CATEGORIA_MAXIMO) return { erro: `O nome pode ter até ${NOME_CATEGORIA_MAXIMO} caracteres.` };
  return { nome };
}

/** O banco já exige nome único; aqui a checagem ignora maiúsculas ("Shows" = "shows"). */
async function nomeEmUso(nome: string, idAtual?: number): Promise<boolean> {
  const repetida = await prisma.categoria.findFirst({
    where: { nome: { equals: nome, mode: 'insensitive' }, ...(idAtual ? { NOT: { id: idAtual } } : {}) },
  });
  return Boolean(repetida);
}

function idDaCategoria(req: Request): number | null {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** POST /api/categorias (só ADMIN) */
export const criarCategoria = async (req: Request, res: Response): Promise<void> => {
  const { nome, erro } = nomeDaCategoria(req.body);
  if (!nome) {
    res.status(400).json({ erro });
    return;
  }
  try {
    if (await nomeEmUso(nome)) {
      res.status(409).json({ erro: 'Já existe uma categoria com esse nome.' });
      return;
    }
    const novaCategoria = await prisma.categoria.create({ data: { nome } });
    res.status(201).json(novaCategoria);
  } catch (_error) {
    res.status(400).json({ erro: 'Erro ao criar categoria' });
  }
};

/** PUT /api/categorias/:id (só ADMIN) */
export const atualizarCategoria = async (req: Request, res: Response): Promise<void> => {
  const id = idDaCategoria(req);
  if (!id) {
    res.status(404).json({ erro: 'Categoria não encontrada' });
    return;
  }
  const { nome, erro } = nomeDaCategoria(req.body);
  if (!nome) {
    res.status(400).json({ erro });
    return;
  }
  try {
    const existente = await prisma.categoria.findUnique({ where: { id } });
    if (!existente) {
      res.status(404).json({ erro: 'Categoria não encontrada' });
      return;
    }
    if (await nomeEmUso(nome, id)) {
      res.status(409).json({ erro: 'Já existe uma categoria com esse nome.' });
      return;
    }
    const atualizada = await prisma.categoria.update({ where: { id }, data: { nome } });
    res.json(atualizada);
  } catch (_error) {
    res.status(500).json({ erro: 'Erro ao atualizar categoria' });
  }
};

/** DELETE /api/categorias/:id (só ADMIN). Categoria com eventos não sai. */
export const excluirCategoria = async (req: Request, res: Response): Promise<void> => {
  const id = idDaCategoria(req);
  if (!id) {
    res.status(404).json({ erro: 'Categoria não encontrada' });
    return;
  }
  try {
    const existente = await prisma.categoria.findUnique({ where: { id } });
    if (!existente) {
      res.status(404).json({ erro: 'Categoria não encontrada' });
      return;
    }
    const emUso = await prisma.evento.count({ where: { categoriaId: id } });
    if (emUso > 0) {
      const eventos = emUso === 1 ? 'evento' : 'eventos';
      const deles = emUso === 1 ? 'dele' : 'deles';
      res.status(409).json({
        erro: `Esta categoria tem ${emUso} ${eventos}. Troque a categoria ${deles} antes de excluir.`,
      });
      return;
    }
    // Interesses de usuários nessa categoria saem junto (cascade no banco).
    await prisma.categoria.delete({ where: { id } });
    res.json({ mensagem: 'Categoria excluída' });
  } catch (_error) {
    res.status(500).json({ erro: 'Erro ao excluir categoria' });
  }
};
