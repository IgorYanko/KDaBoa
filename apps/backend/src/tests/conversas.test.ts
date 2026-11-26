import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  usuario: { findUnique: vi.fn(), findMany: vi.fn() },
  seguidor: { findMany: vi.fn() },
  bloqueio: { findMany: vi.fn() },
  mensagemDireta: { findMany: vi.fn(), create: vi.fn() },
}));

const tempoRealMock = vi.hoisted(() => ({ avisarUsuario: vi.fn() }));

vi.mock('../prisma', () => ({ prisma: prismaMock }));
vi.mock('../realtime', () => ({ avisarUsuario: tempoRealMock.avisarUsuario }));

import app from '../app';

const EU = '987fcdeb-51a2-43d7-9012-345678901234';
const ANA = '123e4567-e89b-12d3-a456-426614174000';
const BRUNO = '223e4567-e89b-12d3-a456-426614174000';
const CARLA = '323e4567-e89b-12d3-a456-426614174000';

const auth = () => `Bearer ${jwt.sign({ id: EU, email: 'eu@kdaboa.com' }, 'segredo_de_teste')}`;

/** Simula quem segue quem: pares [seguidor, seguido]. */
function seguidas(pares: [string, string][]) {
  prismaMock.seguidor.findMany.mockImplementation(async ({ where }) => {
    if (where.OR) {
      return pares
        .filter(([a, b]) =>
          where.OR.some(
            (c: { seguidorId: string; seguidoId: string }) => c.seguidorId === a && c.seguidoId === b,
          ),
        )
        .map(([a, b]) => ({ seguidorId: a, seguidoId: b }));
    }
    if (where.seguidorId) {
      return pares.filter(([a]) => a === where.seguidorId).map(([, b]) => ({ seguidoId: b }));
    }
    return pares.filter(([, b]) => b === where.seguidoId).map(([a]) => ({ seguidorId: a }));
  });
}

const msg = (id: number, de: string, para: string, quando: string, texto = 'oi') => ({
  id: BigInt(id),
  remetenteId: de,
  destinatarioId: para,
  conteudo: texto,
  criadoEm: new Date(quando),
});

describe('Chat mútuo (/api/conversas)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    vi.clearAllMocks();
    prismaMock.bloqueio.findMany.mockResolvedValue([]);
    prismaMock.mensagemDireta.findMany.mockResolvedValue([]);
  });

  it('exige login', async () => {
    const res = await request(app).get('/api/conversas');
    expect(res.status).toBe(401);
  });

  it('lista quem segue de volta e conversas antigas como só leitura, sem quem bloqueou', async () => {
    // Ana: mútuo. Bruno: eu sigo, ele não (conversa antiga). Carla: mútua, mas me bloqueou.
    seguidas([
      [EU, ANA],
      [ANA, EU],
      [EU, BRUNO],
      [EU, CARLA],
      [CARLA, EU],
    ]);
    prismaMock.bloqueio.findMany.mockResolvedValue([{ bloqueadorId: CARLA, bloqueadoId: EU }]);
    prismaMock.mensagemDireta.findMany.mockResolvedValue([msg(2, BRUNO, EU, '2026-11-20T10:00:00Z', 'e aí')]);
    prismaMock.usuario.findMany.mockImplementation(async ({ where }) =>
      [
        { id: ANA, nome: 'Ana', fotoUrl: null },
        { id: BRUNO, nome: 'Bruno', fotoUrl: null },
        { id: CARLA, nome: 'Carla', fotoUrl: null },
      ].filter((u) => where.id.in.includes(u.id)),
    );

    const res = await request(app).get('/api/conversas').set('Authorization', auth());

    expect(res.status).toBe(200);
    expect(res.body.map((c: { usuario: { nome: string } }) => c.usuario.nome)).toEqual(['Bruno', 'Ana']);
    expect(res.body[0]).toMatchObject({ pode_enviar: false, ultima_mensagem: { texto: 'e aí', remetente_id: BRUNO } });
    expect(res.body[1]).toMatchObject({ pode_enviar: true, ultima_mensagem: null });
  });

  it('abre a conversa com quem se segue nos dois sentidos', async () => {
    seguidas([
      [EU, ANA],
      [ANA, EU],
    ]);
    prismaMock.usuario.findUnique.mockResolvedValue({ id: ANA, nome: 'Ana', fotoUrl: null });
    prismaMock.mensagemDireta.findMany.mockResolvedValue([
      msg(2, ANA, EU, '2026-11-20T10:05:00Z', 'bora?'),
      msg(1, EU, ANA, '2026-11-20T10:00:00Z', 'vai no show?'),
    ]);

    const res = await request(app).get(`/api/conversas/${ANA}`).set('Authorization', auth());

    expect(res.status).toBe(200);
    expect(res.body.pode_enviar).toBe(true);
    expect(res.body.mensagens.map((m: { texto: string }) => m.texto)).toEqual(['vai no show?', 'bora?']);
  });

  it('não abre conversa com quem não segue de volta e nunca conversou', async () => {
    seguidas([[EU, ANA]]);
    prismaMock.usuario.findUnique.mockResolvedValue({ id: ANA, nome: 'Ana', fotoUrl: null });

    const res = await request(app).get(`/api/conversas/${ANA}`).set('Authorization', auth());

    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(/precisam se seguir/);
  });

  it('envia, grava e avisa os dois em tempo real', async () => {
    seguidas([
      [EU, ANA],
      [ANA, EU],
    ]);
    prismaMock.mensagemDireta.create.mockResolvedValue(msg(7, EU, ANA, '2026-11-20T11:00:00Z', 'chego 21h'));

    const res = await request(app)
      .post(`/api/conversas/${ANA}`)
      .set('Authorization', auth())
      .send({ texto: '  chego 21h  ' });

    expect(res.status).toBe(201);
    expect(prismaMock.mensagemDireta.create).toHaveBeenCalledWith({
      data: { remetenteId: EU, destinatarioId: ANA, conteudo: 'chego 21h' },
    });
    expect(tempoRealMock.avisarUsuario).toHaveBeenCalledWith(ANA, 'nova_direta', expect.objectContaining({ id: '7' }));
    expect(tempoRealMock.avisarUsuario).toHaveBeenCalledWith(EU, 'nova_direta', expect.objectContaining({ id: '7' }));
  });

  it('não envia depois que um deixa de seguir (conversa fica só leitura)', async () => {
    seguidas([[EU, ANA]]);

    const res = await request(app).post(`/api/conversas/${ANA}`).set('Authorization', auth()).send({ texto: 'oi' });

    expect(res.status).toBe(403);
    expect(prismaMock.mensagemDireta.create).not.toHaveBeenCalled();
  });

  it('não envia nem abre com bloqueio', async () => {
    seguidas([
      [EU, ANA],
      [ANA, EU],
    ]);
    prismaMock.bloqueio.findMany.mockResolvedValue([{ bloqueadorId: EU, bloqueadoId: ANA }]);
    prismaMock.usuario.findUnique.mockResolvedValue({ id: ANA, nome: 'Ana', fotoUrl: null });

    const enviar = await request(app).post(`/api/conversas/${ANA}`).set('Authorization', auth()).send({ texto: 'oi' });
    const abrir = await request(app).get(`/api/conversas/${ANA}`).set('Authorization', auth());

    expect(enviar.status).toBe(403);
    expect(abrir.status).toBe(403);
  });

  it('valida texto, id e conversa consigo mesmo', async () => {
    const vazio = await request(app).post(`/api/conversas/${ANA}`).set('Authorization', auth()).send({ texto: '   ' });
    const longo = await request(app)
      .post(`/api/conversas/${ANA}`)
      .set('Authorization', auth())
      .send({ texto: 'a'.repeat(1001) });
    const idRuim = await request(app).get('/api/conversas/abc').set('Authorization', auth());
    const euMesmo = await request(app).post(`/api/conversas/${EU}`).set('Authorization', auth()).send({ texto: 'oi' });

    expect(vazio.status).toBe(400);
    expect(longo.status).toBe(400);
    expect(idRuim.status).toBe(404);
    expect(euMesmo.status).toBe(400);
  });
});
