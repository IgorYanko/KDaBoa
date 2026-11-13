import bcrypt from 'bcrypt';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const senhaHashKayo = bcrypt.hashSync('qualquer_senha', 10);

vi.mock('../prisma', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn().mockImplementation(({ where: { email } }) => {
        if (email === 'kayo@email.com') {
          return Promise.resolve({
            id: '987fcdeb-51a2-43d7-9012-345678901234',
            nome: 'Kayo',
            email: 'kayo@email.com',
            senhaHash: senhaHashKayo,
            dataNascimento: new Date('2000-01-01'),
          });
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'uuid-novo-usuario',
          nome: data.nome,
          email: data.email,
          senhaHash: data.senhaHash,
          dataNascimento: data.dataNascimento,
        })
      ),
    },
  },
}));

import app from '../app';

describe('API de usuários', () => {
  it('POST /api/usuarios/cadastro cria um usuário', async () => {
    const resposta = await request(app).post('/api/usuarios/cadastro').send({
      nome: 'João Pedro',
      email: 'joao@email.com',
      senha: 'senha_segura_123',
      data_nascimento: '2006-03-30',
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.mensagem).toBe('Usuário cadastrado com sucesso!');
    expect(resposta.body.usuario.email).toBe('joao@email.com');
  });

  it('POST /api/usuarios/login entra com um usuário existente', async () => {
    const resposta = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'kayo@email.com', senha: 'qualquer_senha' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.token).toBeDefined();
  });

  it('POST /api/usuarios/login recusa e-mail desconhecido', async () => {
    const resposta = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'ninguem@email.com', senha: '123' });

    expect(resposta.status).toBe(401);
  });

  it('POST /api/usuarios/cadastro recusa e-mail já cadastrado', async () => {
    const resposta = await request(app).post('/api/usuarios/cadastro').send({
      nome: 'Kayo',
      email: 'kayo@email.com',
      senha: 'qualquer_senha',
    });

    expect(resposta.status).toBe(400);
  });

  it('POST /api/usuarios/cadastro usa senha e data padrão', async () => {
    const resposta = await request(app).post('/api/usuarios/cadastro').send({
      nome: 'Sem dados',
      email: 'semdados@email.com',
    });

    expect(resposta.status).toBe(201);
  });

  it('POST /api/usuarios/cadastro aceita dataNascimento', async () => {
    const resposta = await request(app).post('/api/usuarios/cadastro').send({
      nome: 'Ana',
      email: 'ana@email.com',
      senha: 'senha_segura_123',
      dataNascimento: '1999-05-05',
    });

    expect(resposta.status).toBe(201);
  });

  it('POST /api/usuarios/login recusa senha errada', async () => {
    const resposta = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'kayo@email.com', senha: 'errada' });

    expect(resposta.status).toBe(401);
  });

  it('POST /api/usuarios/login usa o segredo padrão quando JWT_SECRET falta', async () => {
    delete process.env.JWT_SECRET;

    const resposta = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'kayo@email.com', senha: 'qualquer_senha' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.token).toBeDefined();
  });

  it('POST /api/usuarios/cadastro devolve 500 quando a consulta falha', async () => {
    const { prisma } = await import('../prisma');
    vi.mocked(prisma.usuario.findUnique).mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app).post('/api/usuarios/cadastro').send({
      nome: 'Erro',
      email: 'erro@email.com',
      senha: 'senha_segura_123',
    });

    expect(resposta.status).toBe(500);
  });

  it('POST /api/usuarios/login devolve 500 quando a consulta falha', async () => {
    const { prisma } = await import('../prisma');
    vi.mocked(prisma.usuario.findUnique).mockRejectedValueOnce(new Error('falha'));

    const resposta = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'kayo@email.com', senha: 'qualquer_senha' });

    expect(resposta.status).toBe(500);
  });
});