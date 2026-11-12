import request from 'supertest';
import { describe, expect, it } from 'vitest';
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
});
