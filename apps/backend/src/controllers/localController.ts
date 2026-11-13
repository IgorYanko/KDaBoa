import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getLocais = async (req: Request, res: Response): Promise<void> => {
  try {
    const locais = await prisma.local.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(locais);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar locais' });
  }
};

export const criarLocal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, cep, endereco, bairro, latitude, longitude } = req.body;
    const novoLocal = await prisma.local.create({
      data: { nome, cep, endereco, bairro, latitude, longitude },
    });
    res.status(201).json(novoLocal);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao criar local' });
  }
};