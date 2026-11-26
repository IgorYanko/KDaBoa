import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  presenca: {
    findUnique: vi.fn(),
  },
  mensagem: {
    findUnique: vi.fn(),
  },
  denuncia: {
    upsert: vi.fn(),
  },
}));

vi.mock('../prisma', () => ({
  prisma: prismaMock,
}));

import app from '../app';

const EVENTO_ID = '123e4567-e89b-12d3-a456-426614174000';
const OUTRO_EVENTO_ID = '223e4567-e89b-12d3-a456-426614174999';
const DENUNCIANTE_ID = '987fcdeb-51a2-43d7-9012-345678901234';
const AUTOR_MENSAGEM_ID = '555fcdeb-51a2-43d7-9012-345678905555';

function authHeader() {
  const token = jwt.sign(
    { id: DENUNCIANTE_ID, email: 'joao@kdaboa.com' },
    'segredo_de_teste',
  );
  return `Bearer ${token}`;
}

describe('API de Denúncias de Mensagem (Card 34)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    vi.clearAllMocks();
  });

  it('exige autenticação (401 sem token)', async () => {
    const res = await request(app)
      .post(`/api/denuncias/${EVENTO_ID}/10`)
      .send({ motivo: 'Spam' });

    expect(res.status).toBe(401);
  });

  it('recusa denúncia de quem não confirmou presença no evento (403)', async () => {
    prismaMock.presenca.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/denuncias/${EVENTO_ID}/10`)
      .set('Authorization', authHeader())
      .send({ motivo: 'Ofensa' });

    expect(res.status).toBe(403);
    expect(prismaMock.denuncia.upsert).not.toHaveBeenCalled();
  });

  it('recusa mensagem inexistente (404)', async () => {
    prismaMock.presenca.findUnique.mockResolvedValue({
      usuarioId: DENUNCIANTE_ID,
      eventoId: EVENTO_ID,
    });
    prismaMock.mensagem.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/denuncias/${EVENTO_ID}/999`)
      .set('Authorization', authHeader())
      .send({ motivo: 'Spam' });

    expect(res.status).toBe(404);
    expect(prismaMock.denuncia.upsert).not.toHaveBeenCalled();
  });

  it('recusa mensagem pertencente a outro evento (404)', async () => {
    prismaMock.presenca.findUnique.mockResolvedValue({
      usuarioId: DENUNCIANTE_ID,
      eventoId: EVENTO_ID,
    });
    prismaMock.mensagem.findUnique.mockResolvedValue({
      id: 10n,
      eventoId: OUTRO_EVENTO_ID,
      usuarioId: AUTOR_MENSAGEM_ID,
      conteudo: 'Mensagem de outro evento',
    });

    const res = await request(app)
      .post(`/api/denuncias/${EVENTO_ID}/10`)
      .set('Authorization', authHeader())
      .send({ motivo: 'Spam' });

    expect(res.status).toBe(404);
    expect(prismaMock.denuncia.upsert).not.toHaveBeenCalled();
  });

  it('grava denúncia ligada à mensagem, denunciante e autor da mensagem (201)', async () => {
    prismaMock.presenca.findUnique.mockResolvedValue({
      usuarioId: DENUNCIANTE_ID,
      eventoId: EVENTO_ID,
    });
    prismaMock.mensagem.findUnique.mockResolvedValue({
      id: 10n,
      eventoId: EVENTO_ID,
      usuarioId: AUTOR_MENSAGEM_ID,
      conteudo: 'Mensagem ofensiva',
    });
    prismaMock.denuncia.upsert.mockResolvedValue({
      id: 'den-1',
      mensagemId: 10n,
      denuncianteId: DENUNCIANTE_ID,
      motivo: 'Linguagem imprópria',
      status: 'pendente',
      criadoEm: new Date('2026-11-26T20:00:00Z'),
    });

    const res = await request(app)
      .post(`/api/denuncias/${EVENTO_ID}/10`)
      .set('Authorization', authHeader())
      .send({ motivo: 'Linguagem imprópria' });

    expect(res.status).toBe(201);
    expect(res.body.denuncia).toMatchObject({
      id: 'den-1',
      mensagemId: '10',
      denuncianteId: DENUNCIANTE_ID,
      autorMensagemId: AUTOR_MENSAGEM_ID,
      eventoId: EVENTO_ID,
      motivo: 'Linguagem imprópria',
      status: 'pendente',
    });
    expect(prismaMock.denuncia.upsert).toHaveBeenCalledWith({
      where: {
        mensagemId_denuncianteId: {
          mensagemId: 10n,
          denuncianteId: DENUNCIANTE_ID,
        },
      },
      update: {
        motivo: 'Linguagem imprópria',
      },
      create: {
        mensagemId: 10n,
        denuncianteId: DENUNCIANTE_ID,
        motivo: 'Linguagem imprópria',
      },
    });
  });

  it('aceita POST /api/denuncias recebendo os IDs pelo body (201)', async () => {
    prismaMock.presenca.findUnique.mockResolvedValue({
      usuarioId: DENUNCIANTE_ID,
      eventoId: EVENTO_ID,
    });
    prismaMock.mensagem.findUnique.mockResolvedValue({
      id: 10n,
      eventoId: EVENTO_ID,
      usuarioId: AUTOR_MENSAGEM_ID,
      conteudo: 'Mensagem ofensiva',
    });
    prismaMock.denuncia.upsert.mockResolvedValue({
      id: 'den-2',
      mensagemId: 10n,
      denuncianteId: DENUNCIANTE_ID,
      motivo: 'Spam',
      status: 'pendente',
      criadoEm: new Date('2026-11-26T20:00:00Z'),
    });

    const res = await request(app)
      .post('/api/denuncias')
      .set('Authorization', authHeader())
      .send({ eventoId: EVENTO_ID, mensagemId: '10', motivo: 'Spam' });

    expect(res.status).toBe(201);
    expect(res.body.denuncia.mensagemId).toBe('10');
    expect(res.body.denuncia.autorMensagemId).toBe(AUTOR_MENSAGEM_ID);
  });

  it('impede o usuário de denunciar a própria mensagem (400)', async () => {
    prismaMock.presenca.findUnique.mockResolvedValue({
      usuarioId: DENUNCIANTE_ID,
      eventoId: EVENTO_ID,
    });
    prismaMock.mensagem.findUnique.mockResolvedValue({
      id: 10n,
      eventoId: EVENTO_ID,
      usuarioId: DENUNCIANTE_ID,
      conteudo: 'Minha mensagem',
    });

    const res = await request(app)
      .post(`/api/denuncias/${EVENTO_ID}/10`)
      .set('Authorization', authHeader())
      .send({ motivo: 'Teste' });

    expect(res.status).toBe(400);
  });
});