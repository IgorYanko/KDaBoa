import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  usuario: {
    findUnique: vi.fn(),
  },
  presenca: {
    findUnique: vi.fn(),
  },
  bloqueio: {
    findMany: vi.fn(),
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
const EVENTO_ID = '323e4567-e89b-12d3-a456-426614174111';

function authHeader() {
  const token = jwt.sign(
    { id: USUARIO_LOGADO_ID, email: 'joao@kdaboa.com' },
    'segredo_de_teste',
  );
  return `Bearer ${token}`;
}

describe('API de Bloqueio de Usuários (Card 32)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    vi.clearAllMocks();
  });

  it('POST /api/bloqueios/:usuarioId exige autenticação (401 sem token)', async () => {
    const res = await request(app).post(`/api/bloqueios/${OUTRO_USUARIO_ID}`);

    expect(res.status).toBe(401);
  });

  it('POST /api/bloqueios/:usuarioId bloqueia um usuário existente (201)', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: OUTRO_USUARIO_ID });
    prismaMock.bloqueio.upsert.mockResolvedValue({
      bloqueadorId: USUARIO_LOGADO_ID,
      bloqueadoId: OUTRO_USUARIO_ID,
    });

    const res = await request(app)
      .post(`/api/bloqueios/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(201);
    expect(prismaMock.bloqueio.upsert).toHaveBeenCalledWith({
      where: {
        bloqueadorId_bloqueadoId: {
          bloqueadorId: USUARIO_LOGADO_ID,
          bloqueadoId: OUTRO_USUARIO_ID,
        },
      },
      update: {},
      create: {
        bloqueadorId: USUARIO_LOGADO_ID,
        bloqueadoId: OUTRO_USUARIO_ID,
      },
    });
  });

  it('POST /api/bloqueios/:usuarioId recusa bloqueio vindo do chat se não tiver presença no evento (403)', async () => {
    prismaMock.presenca.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/bloqueios/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader())
      .send({ eventoId: EVENTO_ID });

    expect(res.status).toBe(403);
    expect(prismaMock.bloqueio.upsert).not.toHaveBeenCalled();
  });

  it('POST /api/bloqueios/:usuarioId permite bloqueio vindo do chat quando há presença confirmada (201)', async () => {
    prismaMock.presenca.findUnique.mockResolvedValue({
      usuarioId: USUARIO_LOGADO_ID,
      eventoId: EVENTO_ID,
    });
    prismaMock.usuario.findUnique.mockResolvedValue({ id: OUTRO_USUARIO_ID });
    prismaMock.bloqueio.upsert.mockResolvedValue({
      bloqueadorId: USUARIO_LOGADO_ID,
      bloqueadoId: OUTRO_USUARIO_ID,
    });

    const res = await request(app)
      .post(`/api/bloqueios/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader())
      .send({ eventoId: EVENTO_ID });

    expect(res.status).toBe(201);
    expect(prismaMock.presenca.findUnique).toHaveBeenCalledWith({
      where: {
        usuarioId_eventoId: {
          usuarioId: USUARIO_LOGADO_ID,
          eventoId: EVENTO_ID,
        },
      },
    });
  });

  it('POST /api/bloqueios/:usuarioId não duplica ao bloquear novamente', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: OUTRO_USUARIO_ID });
    prismaMock.bloqueio.upsert.mockResolvedValue({
      bloqueadorId: USUARIO_LOGADO_ID,
      bloqueadoId: OUTRO_USUARIO_ID,
    });

    const primeira = await request(app)
      .post(`/api/bloqueios/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());
    const segunda = await request(app)
      .post(`/api/bloqueios/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());

    expect(primeira.status).toBe(201);
    expect(segunda.status).toBe(201);
    expect(prismaMock.bloqueio.upsert).toHaveBeenCalledTimes(2);
  });

  it('POST /api/bloqueios/:usuarioId impede bloquear a si mesmo (400)', async () => {
    const res = await request(app)
      .post(`/api/bloqueios/${USUARIO_LOGADO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(400);
  });

  it('POST /api/bloqueios/:usuarioId retorna 404 para usuário inexistente', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/bloqueios/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });

  it('GET /api/bloqueios lista os usuários bloqueados pelo usuário logado', async () => {
    prismaMock.bloqueio.findMany.mockResolvedValue([
      {
        criadoEm: new Date('2026-11-26T20:00:00Z'),
        bloqueado: {
          id: OUTRO_USUARIO_ID,
          nome: 'Usuário Bloqueado',
          fotoUrl: null,
        },
      },
    ]);

    const res = await request(app)
      .get('/api/bloqueios')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.bloqueados).toHaveLength(1);
    expect(res.body.bloqueados[0].nome).toBe('Usuário Bloqueado');
  });

  it('DELETE /api/bloqueios/:usuarioId remove o bloqueio (204)', async () => {
    prismaMock.bloqueio.delete.mockResolvedValue({
      bloqueadorId: USUARIO_LOGADO_ID,
      bloqueadoId: OUTRO_USUARIO_ID,
    });

    const res = await request(app)
      .delete(`/api/bloqueios/${OUTRO_USUARIO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(204);
  });
});