import { Request, Response } from 'express';

const locaisMock = [
  { id: 1, nome: 'Teatro Municipal', endereco: 'Av. Dr. Lisboa, Centro', capacidade: 500 },
  { id: 2, nome: 'Estádio Manduzão', endereco: 'Bairro Fátima I', capacidade: 26000 },
  { id: 3, nome: 'Pista de Skate QG', endereco: 'Pouso Alegre', capacidade: 150 }
];

export const getLocais = (req: Request, res: Response) => {
  res.json(locaisMock);
};