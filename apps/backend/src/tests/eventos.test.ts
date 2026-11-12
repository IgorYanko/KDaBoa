import request from 'supertest';
import { describe, expect, it } from 'vitest';
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
