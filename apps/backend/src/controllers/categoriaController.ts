import type { Request, Response } from 'express';
import { prisma } from '../prisma';

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

export const criarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome } = req.body;
    const novaCategoria = await prisma.categoria.create({
      data: { nome },
    });
    res.status(201).json(novaCategoria);
  } catch (_error) {
    res.status(400).json({ erro: 'Erro ao criar categoria' });
  }
};