import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';

describe('API de categorias e locais', () => {
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
});
