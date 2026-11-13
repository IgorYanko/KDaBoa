import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../app';

const usuario = {
  nome: 'Maria',
  email: 'maria@email.com',
  senha: 'senha_segura_123',
};

describe('API de autenticação', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('POST /api/auth/cadastro cria um usuário', async () => {
    const resposta = await request(app).post('/api/auth/cadastro').send(usuario);

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.email).toBe(usuario.email);
  });

  it('POST /api/auth/cadastro recusa e-mail repetido', async () => {
    const resposta = await request(app).post('/api/auth/cadastro').send(usuario);

    expect(resposta.status).toBe(400);
  });

  it('POST /api/auth/cadastro devolve 500 quando falta a senha', async () => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ nome: 'Sem Senha', email: 'semsenha@email.com' });

    expect(resposta.status).toBe(500);
  });

  it('POST /api/auth/login entra com e-mail e senha certos', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: usuario.email, senha: usuario.senha });

    expect(resposta.status).toBe(200);
    expect(resposta.body.token).toBeDefined();
  });

  it('POST /api/auth/login recusa senha errada', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: usuario.email, senha: 'errada' });

    expect(resposta.status).toBe(401);
  });

  it('POST /api/auth/login recusa e-mail inexistente', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@email.com', senha: 'qualquer' });

    expect(resposta.status).toBe(401);
  });

  it('POST /api/auth/login devolve 500 sem o JWT_SECRET configurado', async () => {
    delete process.env.JWT_SECRET;

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: usuario.email, senha: usuario.senha });

    expect(resposta.status).toBe(500);
  });
});
