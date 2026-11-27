import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  local: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  categoria: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  evento: { count: vi.fn() },
}));

vi.mock('../prisma', () => ({ prisma: prismaMock }));

import app from '../app';

const token = (perfil: 'USUARIO' | 'ORGANIZADOR' | 'ADMIN') =>
  `Bearer ${jwt.sign({ id: '987fcdeb-51a2-43d7-9012-345678901234', email: 'a@kdaboa.com', perfil }, 'segredo_de_teste')}`;
const admin = () => token('ADMIN');

describe('Área de admin: CRUD de locais e categorias', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    vi.clearAllMocks();
    prismaMock.evento.count.mockResolvedValue(0);
    prismaMock.categoria.findFirst.mockResolvedValue(null);
  });

  describe('permissão', () => {
    it('sem login: 401', async () => {
      const res = await request(app).post('/api/locais').send({ nome: 'Teatro', endereco: 'Rua A, 1' });
      expect(res.status).toBe(401);
    });

    it('usuário comum e conta CNPJ não mexem em locais nem categorias (403)', async () => {
      for (const perfil of ['USUARIO', 'ORGANIZADOR'] as const) {
        const locais = await request(app).delete('/api/locais/1').set('Authorization', token(perfil));
        const categorias = await request(app)
          .post('/api/categorias')
          .set('Authorization', token(perfil))
          .send({ nome: 'Feiras' });
        expect(locais.status).toBe(403);
        expect(categorias.status).toBe(403);
      }
      expect(prismaMock.local.delete).not.toHaveBeenCalled();
      expect(prismaMock.categoria.create).not.toHaveBeenCalled();
    });

    it('a listagem continua pública', async () => {
      prismaMock.local.findMany.mockResolvedValue([{ id: 1, nome: 'Bar do Centro' }]);
      const res = await request(app).get('/api/locais');
      expect(res.status).toBe(200);
    });
  });

  describe('locais', () => {
    it('cria com nome e endereço, limpando os espaços', async () => {
      prismaMock.local.create.mockImplementation(async ({ data }) => ({ id: 9, ...data }));
      const res = await request(app)
        .post('/api/locais')
        .set('Authorization', admin())
        .send({ nome: ' Teatro Municipal ', endereco: 'Rua Silviano Brandão, 200', bairro: '', cep: '37550-000' });

      expect(res.status).toBe(201);
      expect(prismaMock.local.create).toHaveBeenCalledWith({
        data: {
          nome: 'Teatro Municipal',
          endereco: 'Rua Silviano Brandão, 200',
          cep: '37550-000',
          bairro: null,
          latitude: null,
          longitude: null,
        },
      });
    });

    it('recusa sem nome ou sem endereço (400)', async () => {
      const semNome = await request(app).post('/api/locais').set('Authorization', admin()).send({ endereco: 'Rua A' });
      const semEndereco = await request(app).post('/api/locais').set('Authorization', admin()).send({ nome: 'Teatro' });
      expect(semNome.body.erro).toBe('Dê um nome ao local.');
      expect(semEndereco.body.erro).toBe('Informe o endereço.');
      expect(prismaMock.local.create).not.toHaveBeenCalled();
    });

    it('edita e mantém as coordenadas que já existiam', async () => {
      prismaMock.local.findUnique.mockResolvedValue({ id: 2, latitude: -22.23, longitude: -45.93 });
      prismaMock.local.update.mockImplementation(async ({ data }) => ({ id: 2, ...data }));
      const res = await request(app)
        .put('/api/locais/2')
        .set('Authorization', admin())
        .send({ nome: 'Praça Central', endereco: 'Praça Senador José Bento' });

      expect(res.status).toBe(200);
      expect(prismaMock.local.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: expect.objectContaining({ nome: 'Praça Central', latitude: -22.23, longitude: -45.93 }),
      });
    });

    it('editar local que não existe: 404', async () => {
      prismaMock.local.findUnique.mockResolvedValue(null);
      const res = await request(app)
        .put('/api/locais/99')
        .set('Authorization', admin())
        .send({ nome: 'X', endereco: 'Y' });
      const idRuim = await request(app).put('/api/locais/abc').set('Authorization', admin()).send({ nome: 'X', endereco: 'Y' });
      expect(res.status).toBe(404);
      expect(idRuim.status).toBe(404);
    });

    it('não exclui local com eventos (409) e exclui quando está livre', async () => {
      prismaMock.local.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.evento.count.mockResolvedValueOnce(3);
      const emUso = await request(app).delete('/api/locais/1').set('Authorization', admin());
      expect(emUso.status).toBe(409);
      expect(emUso.body.erro).toBe('Este local tem 3 eventos. Troque o local deles antes de excluir.');
      expect(prismaMock.local.delete).not.toHaveBeenCalled();

      const livre = await request(app).delete('/api/locais/1').set('Authorization', admin());
      expect(livre.status).toBe(200);
      expect(prismaMock.local.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('categorias', () => {
    it('cria categoria nova', async () => {
      prismaMock.categoria.create.mockImplementation(async ({ data }) => ({ id: 7, ...data }));
      const res = await request(app).post('/api/categorias').set('Authorization', admin()).send({ nome: ' Stand-up ' });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 7, nome: 'Stand-up' });
    });

    it('não repete nome, sem diferenciar maiúsculas (409)', async () => {
      prismaMock.categoria.findFirst.mockResolvedValue({ id: 1, nome: 'Shows' });
      const res = await request(app).post('/api/categorias').set('Authorization', admin()).send({ nome: 'shows' });
      expect(res.status).toBe(409);
      expect(prismaMock.categoria.findFirst).toHaveBeenCalledWith({
        where: { nome: { equals: 'shows', mode: 'insensitive' } },
      });
    });

    it('valida o nome (vazio e longo demais)', async () => {
      const vazio = await request(app).post('/api/categorias').set('Authorization', admin()).send({ nome: '  ' });
      const longo = await request(app)
        .post('/api/categorias')
        .set('Authorization', admin())
        .send({ nome: 'a'.repeat(61) });
      expect(vazio.status).toBe(400);
      expect(longo.status).toBe(400);
    });

    it('edita ignorando a própria categoria na checagem de nome', async () => {
      prismaMock.categoria.findUnique.mockResolvedValue({ id: 3, nome: 'Teatro' });
      prismaMock.categoria.update.mockResolvedValue({ id: 3, nome: 'Teatro e Stand-up' });
      const res = await request(app)
        .put('/api/categorias/3')
        .set('Authorization', admin())
        .send({ nome: 'Teatro e Stand-up' });
      expect(res.status).toBe(200);
      expect(prismaMock.categoria.findFirst).toHaveBeenCalledWith({
        where: { nome: { equals: 'Teatro e Stand-up', mode: 'insensitive' }, NOT: { id: 3 } },
      });
    });

    it('não exclui categoria com eventos (409) e exclui quando está livre', async () => {
      prismaMock.categoria.findUnique.mockResolvedValue({ id: 2 });
      prismaMock.evento.count.mockResolvedValueOnce(1);
      const emUso = await request(app).delete('/api/categorias/2').set('Authorization', admin());
      expect(emUso.status).toBe(409);
      expect(emUso.body.erro).toBe('Esta categoria tem 1 evento. Troque a categoria dele antes de excluir.');

      const livre = await request(app).delete('/api/categorias/2').set('Authorization', admin());
      expect(livre.status).toBe(200);
      expect(prismaMock.categoria.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('excluir categoria que não existe: 404', async () => {
      prismaMock.categoria.findUnique.mockResolvedValue(null);
      const res = await request(app).delete('/api/categorias/50').set('Authorization', admin());
      expect(res.status).toBe(404);
    });
  });
});
