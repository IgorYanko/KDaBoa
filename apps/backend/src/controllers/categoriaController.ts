import { Request, Response } from 'express';

const categoriasMock = [
  { id: 1, nome: 'Shows e Música ao Vivo' },
  { id: 2, nome: 'Esportes e Competições' },
  { id: 3, nome: 'Teatro e Stand-up' },
  { id: 4, nome: 'Festas e Baladas' }
];

export const getCategorias = (req: Request, res: Response) => {
  res.json(categoriasMock);
};