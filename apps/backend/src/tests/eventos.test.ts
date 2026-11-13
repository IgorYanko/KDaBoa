import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  evento: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../prisma', () => ({
  prisma: prismaMock,
}));

import app from '../app';

const eventoExistente = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  titulo: 'Noite de rock autoral',
  descricao: 'Bandas autorais da região tocando a noite toda.',
  dataInicio: new Date('2026-11-13T21:00:00Z'),
  preco: 0,
  classificacaoEtaria: 16,
  categoriaId: 1,
  localId: 1,
  criadorId: '987fcdeb-51a2-43d7-9012-345678901234',
};

function token(payload: { id?: string; email: string }) {
  return jwt.sign(payload, 'segredo_de_teste');
}

describe('API de eventos', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    prismaMock.evento.findMany.mockResolvedValue([
      eventoExistente,
      {
        ...eventoExistente,
        id: '123e4567-e89b-12d3-a456-426614174001',
        titulo: 'Sarau na praça',
        descricao: 'Evento cultural aberto ao público.',
        dataInicio: new Date('2026-11-14T18:00:00Z'),
        classificacaoEtaria: 0,
        categoriaId: 3,
        localId: 2,
      },
    ]);
    prismaMock.evento.findUnique.mockImplementation(({ where: { id } }) => {
      return Promise.resolve(id === eventoExistente.id ? eventoExistente : null);
    });
    prismaMock.evento.create.mockImplementation(async ({ data }) => ({
      id: '123e4567-e89b-12d3-a456-426614174010',
      ...data,
    }));
    prismaMock.evento.update.mockImplementation(async ({ where, data }) => ({
      id: where.id,
      ...data,
    }));
    prismaMock.evento.delete.mockResolvedValue(eventoExistente);
  });

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

  it('GET /api/eventos devolve 500 quando a consulta falha', async () => {
    prismaMock.evento.findMany.mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app).get('/api/eventos');

    expect(resposta.status).toBe(500);
  });

  it('GET /api/eventos/:id devolve o evento certo', async () => {
    const resposta = await request(app).get(`/api/eventos/${eventoExistente.id}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.titulo).toBe('Noite de rock autoral');
  });

  it('GET /api/eventos/:id devolve 404 quando o id não é uuid', async () => {
    const resposta = await request(app).get('/api/eventos/id-que-nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Evento não encontrado');
  });

  it('GET /api/eventos/:id devolve 404 quando o evento não existe', async () => {
    const resposta = await request(app).get(
      '/api/eventos/123e4567-e89b-12d3-a456-426614174099',
    );

    expect(resposta.status).toBe(404);
  });

  it('GET /api/eventos/:id devolve 500 quando a consulta falha', async () => {
    prismaMock.evento.findUnique.mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app).get(`/api/eventos/${eventoExistente.id}`);

    expect(resposta.status).toBe(500);
  });

  it('POST /api/eventos recusa pedido sem token', async () => {
    const resposta = await request(app).post('/api/eventos').send({ titulo: 'Sem token' });

    expect(resposta.status).toBe(401);
  });

  it('POST /api/eventos recusa token inválido', async () => {
    const resposta = await request(app)
      .post('/api/eventos')
      .set('Authorization', 'Bearer token-invalido')
      .send({ titulo: 'Token ruim' });

    expect(resposta.status).toBe(401);
  });

  it('POST /api/eventos cria com os campos em camelCase', async () => {
    const resposta = await request(app)
      .post('/api/eventos')
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`)
      .send({
        titulo: 'Show novo',
        descricao: 'Descrição',
        dataInicio: '2026-12-01T20:00:00Z',
        dataFim: '2026-12-01T23:00:00Z',
        preco: 40,
        classificacaoEtaria: 18,
        imagemUrl: 'https://exemplo.com/foto.jpg',
        latitude: -22.23,
        longitude: -45.93,
        categoriaId: 1,
        localId: 2,
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body.criadorId).toBe('criador-1');
    expect(resposta.body.titulo).toBe('Show novo');
  });

  it('POST /api/eventos cria com os campos em snake_case e criadorId do corpo', async () => {
    const resposta = await request(app)
      .post('/api/eventos')
      .set('Authorization', `Bearer ${token({ email: 'a@email.com' })}`)
      .send({
        titulo: 'Show snake',
        descricao: 'Descrição',
        data_inicio: '2026-12-02T20:00:00Z',
        data_fim: '2026-12-02T23:00:00Z',
        classificacao_etaria: 12,
        imagem_url: 'https://exemplo.com/snake.jpg',
        categoria_id: 3,
        local_id: 1,
        criadorId: 'criador-corpo',
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body.criadorId).toBe('criador-corpo');
    expect(resposta.body.preco).toBe(0);
  });

  it('POST /api/eventos usa criador_id quando não há id no token', async () => {
    const resposta = await request(app)
      .post('/api/eventos')
      .set('Authorization', `Bearer ${token({ email: 'a@email.com' })}`)
      .send({
        titulo: 'Show mínimo',
        descricao: 'Descrição',
        data_inicio: '2026-12-03T20:00:00Z',
        criador_id: 'criador-snake',
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body.criadorId).toBe('criador-snake');
    expect(resposta.body.dataFim).toBeNull();
  });

  it('POST /api/eventos devolve 400 quando a gravação falha', async () => {
    prismaMock.evento.create.mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app)
      .post('/api/eventos')
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`)
      .send({ titulo: 'Quebra', dataInicio: '2026-12-01T20:00:00Z' });

    expect(resposta.status).toBe(400);
  });

  it('PUT /api/eventos/:id atualiza os campos em camelCase', async () => {
    const resposta = await request(app)
      .put(`/api/eventos/${eventoExistente.id}`)
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`)
      .send({
        titulo: 'Título novo',
        descricao: 'Outra descrição',
        dataInicio: '2026-12-04T20:00:00Z',
        dataFim: '2026-12-04T22:00:00Z',
        preco: 15,
        classificacaoEtaria: 16,
        imagemUrl: 'https://exemplo.com/nova.jpg',
        categoriaId: 2,
        localId: 3,
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body.titulo).toBe('Título novo');
  });

  it('PUT /api/eventos/:id atualiza os campos em snake_case', async () => {
    const resposta = await request(app)
      .put(`/api/eventos/${eventoExistente.id}`)
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`)
      .send({
        data_inicio: '2026-12-05T20:00:00Z',
        data_fim: '2026-12-05T22:00:00Z',
        classificacao_etaria: 10,
        imagem_url: 'https://exemplo.com/snake.jpg',
        categoria_id: 4,
        local_id: 1,
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body.imagemUrl).toBe('https://exemplo.com/snake.jpg');
  });

  it('PUT /api/eventos/:id aceita imagem e classificação nulas no camelCase', async () => {
    const resposta = await request(app)
      .put(`/api/eventos/${eventoExistente.id}`)
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`)
      .send({
        classificacaoEtaria: null,
        classificacao_etaria: 8,
        imagemUrl: null,
        imagem_url: 'https://exemplo.com/fallback.jpg',
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body.classificacaoEtaria).toBe(8);
    expect(resposta.body.imagemUrl).toBe('https://exemplo.com/fallback.jpg');
  });

  it('PUT /api/eventos/:id aceita corpo vazio', async () => {
    const resposta = await request(app)
      .put(`/api/eventos/${eventoExistente.id}`)
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`)
      .send({});

    expect(resposta.status).toBe(200);
  });

  it('PUT /api/eventos/:id devolve 404 quando a atualização falha', async () => {
    prismaMock.evento.update.mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app)
      .put(`/api/eventos/${eventoExistente.id}`)
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`)
      .send({ titulo: 'Não grava' });

    expect(resposta.status).toBe(404);
  });

  it('DELETE /api/eventos/:id remove o evento', async () => {
    const resposta = await request(app)
      .delete(`/api/eventos/${eventoExistente.id}`)
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`);

    expect(resposta.status).toBe(204);
  });

  it('DELETE /api/eventos/:id devolve 404 quando a remoção falha', async () => {
    prismaMock.evento.delete.mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app)
      .delete(`/api/eventos/${eventoExistente.id}`)
      .set('Authorization', `Bearer ${token({ id: 'criador-1', email: 'a@email.com' })}`);

    expect(resposta.status).toBe(404);
  });
});
