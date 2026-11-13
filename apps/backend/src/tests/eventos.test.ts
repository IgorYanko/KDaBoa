import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../prisma', () => ({
  prisma: {
    evento: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          titulo: 'Noite de rock autoral',
          descricao: 'Bandas autorais da região tocando a noite toda.',
          dataInicio: new Date('2026-11-13T21:00:00Z'),
          preco: 0,
          classificacaoEtaria: 16,
          categoriaId: 1,
          localId: 1,
          criadorId: '987fcdeb-51a2-43d7-9012-345678901234',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          titulo: 'Sarau na praça',
          descricao: 'Evento cultural aberto ao público.',
          dataInicio: new Date('2026-11-14T18:00:00Z'),
          preco: 0,
          classificacaoEtaria: 0,
          categoriaId: 3,
          localId: 2,
          criadorId: '987fcdeb-51a2-43d7-9012-345678901234',
        },
      ]),
      findUnique: vi.fn().mockImplementation(({ where: { id } }) => {
        const eventosMock = [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            titulo: 'Noite de rock autoral',
            descricao: 'Bandas autorais da região tocando a noite toda.',
            dataInicio: new Date('2026-11-13T21:00:00Z'),
            preco: 0,
            classificacaoEtaria: 16,
            categoriaId: 1,
            localId: 1,
            criadorId: '987fcdeb-51a2-43d7-9012-345678901234',
          },
        ];
        return Promise.resolve(eventosMock.find((e) => e.id === id) || null);
      }),
    },
  },
}));

import app from '../app';

describe('API de eventos', () => {
  it('GET /api/status responde que a API está rodando', async () => {
    const resposta = await request(app).get('/api/status');

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('API KdABoa rodando!');
  });

  it('GET /api/eventos lista todos os eventos', async () => {
    const resposta = await request(app).get('/api/eventos');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(2);
  });

  it('GET /api/eventos/:id devolve o evento certo', async () => {
    const resposta = await request(app).get(
      '/api/eventos/123e4567-e89b-12d3-a456-426614174000',
    );

    expect(resposta.status).toBe(200);
    expect(resposta.body.titulo).toBe('Noite de rock autoral');
  });

  it('GET /api/eventos/:id devolve 404 quando o evento não existe', async () => {
    const resposta = await request(app).get('/api/eventos/id-que-nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Evento não encontrado');
  });
});