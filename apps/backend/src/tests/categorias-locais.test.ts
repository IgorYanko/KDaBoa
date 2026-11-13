import type { Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  categoria: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  local: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../prisma', () => ({
  prisma: prismaMock,
}));

import app from '../app';
import { criarCategoria, getCategorias } from '../controllers/categoriaController';
import { criarLocal, getLocais } from '../controllers/localController';

function respostaFake() {
  const res = {
    statusCode: 200,
    corpo: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.corpo = body;
      return this;
    },
  };
  return res;
}

describe('API de categorias e locais', () => {
  beforeEach(() => {
    prismaMock.categoria.findMany.mockResolvedValue([
      { id: 1, nome: 'Shows e Música ao Vivo' },
      { id: 2, nome: 'Esportes e Competições' },
      { id: 3, nome: 'Teatro e Stand-up' },
      { id: 4, nome: 'Festas e Baladas' },
    ]);
    prismaMock.local.findMany.mockResolvedValue([
      { id: 1, nome: 'Teatro Municipal' },
      { id: 2, nome: 'Estádio Manduzão' },
      { id: 3, nome: 'Pista de Skate QG' },
    ]);
    prismaMock.categoria.create.mockImplementation(async ({ data }) => ({ id: 5, ...data }));
    prismaMock.local.create.mockImplementation(async ({ data }) => ({ id: 4, ...data }));
  });

  it('GET /api/categorias lista as categorias', async () => {
    const resposta = await request(app).get('/api/categorias');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(4);
  });

  it('GET /api/locais lista os locais', async () => {
    const resposta = await request(app).get('/api/locais');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(3);
  });

  it('GET /api/categorias devolve 500 quando a consulta falha', async () => {
    prismaMock.categoria.findMany.mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app).get('/api/categorias');

    expect(resposta.status).toBe(500);
  });

  it('GET /api/locais devolve 500 quando a consulta falha', async () => {
    prismaMock.local.findMany.mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app).get('/api/locais');

    expect(resposta.status).toBe(500);
  });

  it('criarCategoria grava e devolve 201', async () => {
    const res = respostaFake();

    await criarCategoria({ body: { nome: 'Feiras' } } as Request, res as unknown as Response);

    expect(res.statusCode).toBe(201);
    expect(res.corpo).toMatchObject({ nome: 'Feiras' });
  });

  it('criarCategoria devolve 400 quando a gravação falha', async () => {
    prismaMock.categoria.create.mockRejectedValueOnce(new Error('falha'));
    const res = respostaFake();

    await criarCategoria({ body: { nome: 'Feiras' } } as Request, res as unknown as Response);

    expect(res.statusCode).toBe(400);
  });

  it('criarLocal grava e devolve 201', async () => {
    const res = respostaFake();

    await criarLocal(
      {
        body: {
          nome: 'Praça',
          cep: '37550-000',
          endereco: 'Centro',
          bairro: 'Centro',
          latitude: -22.23,
          longitude: -45.93,
        },
      } as Request,
      res as unknown as Response,
    );

    expect(res.statusCode).toBe(201);
    expect(res.corpo).toMatchObject({ nome: 'Praça' });
  });

  it('criarLocal devolve 400 quando a gravação falha', async () => {
    prismaMock.local.create.mockRejectedValueOnce(new Error('falha'));
    const res = respostaFake();

    await criarLocal({ body: { nome: 'Praça' } } as Request, res as unknown as Response);

    expect(res.statusCode).toBe(400);
  });

  it('getCategorias e getLocais devolvem 500 direto no controller', async () => {
    prismaMock.categoria.findMany.mockRejectedValueOnce(new Error('falha'));
    prismaMock.local.findMany.mockRejectedValueOnce(new Error('falha'));
    const categorias = respostaFake();
    const locais = respostaFake();

    await getCategorias({} as Request, categorias as unknown as Response);
    await getLocais({} as Request, locais as unknown as Response);

    expect(categorias.statusCode).toBe(500);
    expect(locais.statusCode).toBe(500);
  });
});
