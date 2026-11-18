import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  evento: {
    findUnique: vi.fn(),
  },
  usuario: {
    findUnique: vi.fn(),
  },
  presenca: {
    upsert: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('../prisma', () => ({
  prisma: prismaMock,
}));

import app from '../app';

const EVENTO_ID = '123e4567-e89b-12d3-a456-426614174000';
const USUARIO_ID = '987fcdeb-51a2-43d7-9012-345678901234';

function authHeader() {
  const token = jwt.sign(
    { id: USUARIO_ID, email: 'joao@kdaboa.com', perfil: 'USUARIO' },
    'segredo_de_teste',
  );
  return `Bearer ${token}`;
}

describe('API de Presenças e Regras de Negócio', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    vi.clearAllMocks();
  });

  it('POST /api/presencas/:eventoId confirma presença para usuário com idade compatível', async () => {
    prismaMock.evento.findUnique.mockResolvedValue({
      id: EVENTO_ID,
      classificacaoEtaria: 18,
    });
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      dataNascimento: new Date('2000-05-10'),
    });
    prismaMock.presenca.upsert.mockResolvedValue({
      usuarioId: USUARIO_ID,
      eventoId: EVENTO_ID,
    });

    const res = await request(app)
      .post(`/api/presencas/${EVENTO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(201);
    expect(res.body.mensagem).toBe('Presença confirmada com sucesso');
  });

  it('POST /api/presencas/:eventoId bloqueia menor de idade (403)', async () => {
    const anoMenor = new Date().getFullYear() - 15;
    prismaMock.evento.findUnique.mockResolvedValue({
      id: EVENTO_ID,
      classificacaoEtaria: 18,
    });
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      dataNascimento: new Date(`${anoMenor}-05-10`),
    });

    const res = await request(app)
      .post(`/api/presencas/${EVENTO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(403);
    expect(res.body.erro).toContain('18 anos');
  });

  it('DELETE /api/presencas/:eventoId cancela presença confirmada', async () => {
    prismaMock.presenca.delete.mockResolvedValue({
      usuarioId: USUARIO_ID,
      eventoId: EVENTO_ID,
    });

    const res = await request(app)
      .delete(`/api/presencas/${EVENTO_ID}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(204);
  });

  it('GET /api/presencas/:eventoId oculta usuários com mostrarPresenca = false', async () => {
    prismaMock.presenca.findMany.mockResolvedValue([
      {
        confirmadoEm: new Date('2026-11-18T20:00:00Z'),
        usuario: {
          id: 'u1',
          nome: 'Usuário Público',
          fotoUrl: null,
          mostrarPresenca: true,
        },
      },
      {
        confirmadoEm: new Date('2026-11-18T20:05:00Z'),
        usuario: {
          id: 'u2',
          nome: 'Usuário Privado',
          fotoUrl: null,
          mostrarPresenca: false,
        },
      },
    ]);

    const res = await request(app).get(`/api/presencas/${EVENTO_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.confirmados).toHaveLength(1);
    expect(res.body.confirmados[0].nome).toBe('Usuário Público');
  });
});