import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  usuario: {
    findUnique: vi.fn(),
  },
  seguidor: {
    upsert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../prisma', () => ({
  prisma: prismaMock,
}));

import app from '../app';

const USUARIO_LOGADO_ID = '987fcdeb-51a2-43d7-9012-345678901234';
const OUTRO_USUARIO_ID = '123e4567-e89b-12d3-a456-426614174000';

function authHeader() {
  const token = jwt.sign(
    { id: USUARIO_LOGADO_ID, email: 'joao@kdaboa.com' },
    'segredo_de_teste',
  );
  return `Bearer ${token}`;
}

describe('API de Seguidores (Card 28)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    vi.clearAllMocks();
  });

  it('POST /api/seguidores/:usuarioId exige autenticação (401 sem token)', async () => {
    const res = await request(app).post(`/api/seguidores/${OUTRO_USUARIO_ID}`);

    expect(res.status).toBe(401);
  });

  it('POST /api/seguidores/:usuarioId grava a relação entre os dois usuários', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: OUTRO_USUARIO_ID });
    prismaMock.seguidor.upsert.mockResolvedValue({
      seguidorId: USUARIO_LOGADO_ID,
      seguidoId: OUTRO_USUARIO_ID,
    });

    const res = await request(app)
      .post(`/api/seguidores/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(201);
    expect(prismaMock.seguidor.upsert).toHaveBeenCalledWith({
      where: {
        seguidorId_seguidoId: {
          seguidorId: USUARIO_LOGADO_ID,
          seguidoId: OUTRO_USUARIO_ID,
        },
      },
      update: {},
      create: {
        seguidorId: USUARIO_LOGADO_ID,
        seguidoId: OUTRO_USUARIO_ID,
      },
    });
  });

  it('POST /api/seguidores/:usuarioId não duplica ao seguir novamente', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: OUTRO_USUARIO_ID });
    prismaMock.seguidor.upsert.mockResolvedValue({
      seguidorId: USUARIO_LOGADO_ID,
      seguidoId: OUTRO_USUARIO_ID,
    });

    const primeira = await request(app)
      .post(`/api/seguidores/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());
    const segunda = await request(app)
      .post(`/api/seguidores/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());

    expect(primeira.status).toBe(201);
    expect(segunda.status).toBe(201);
    expect(prismaMock.seguidor.upsert).toHaveBeenCalledTimes(2);
  });

  it('POST /api/seguidores/:usuarioId impede seguir a si mesmo (400)', async () => {
    const res = await request(app)
      .post(`/api/seguidores/${USUARIO_LOGADO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(400);
  });

  it('DELETE /api/seguidores/:usuarioId remove a relação de seguidor', async () => {
    prismaMock.seguidor.delete.mockResolvedValue({
      seguidorId: USUARIO_LOGADO_ID,
      seguidoId: OUTRO_USUARIO_ID,
    });

    const res = await request(app)
      .delete(`/api/seguidores/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(204);
  });
});