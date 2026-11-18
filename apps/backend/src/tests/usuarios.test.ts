import bcrypt from 'bcrypt';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../prisma', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn().mockImplementation(({ where: { email } }) => {
        if (email === 'kayo@email.com') {
          return Promise.resolve({
            id: '987fcdeb-51a2-43d7-9012-345678901234',
            nome: 'Kayo',
            email: 'kayo@email.com',
            senhaHash: bcrypt.hashSync('qualquer_senha', 10),
            dataNascimento: new Date('2000-01-01'),
            mostrarPresenca: true,
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
          mostrarPresenca: data.mostrarPresenca ?? true,
          interesses: data.interesses?.create || [],
        })
      ),
    },
  },
}));

import app from '../app';

describe('API de usuários', () => {
  it('POST /api/usuarios/cadastro cria um usuário com interesses e mostrar_presenca', async () => {
    const resposta = await request(app).post('/api/usuarios/cadastro').send({
      nome: 'João Pedro',
      email: 'joao@email.com',
      senha: 'senha_segura_123',
      data_nascimento: '2006-03-30',
      mostrar_presenca: false,
      interesses: [1, 2],
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.mensagem).toBe('Usuário cadastrado com sucesso!');
    expect(resposta.body.usuario.email).toBe('joao@email.com');
    expect(resposta.body.usuario.mostrar_presenca).toBe(false);
    expect(resposta.body.usuario.interesses).toEqual([1, 2]);
  });

  it('POST /api/usuarios/cadastro retorna 409 se o e-mail já estiver cadastrado', async () => {
    const resposta = await request(app).post('/api/usuarios/cadastro').send({
      nome: 'Kayo Duplicado',
      email: 'kayo@email.com',
      senha: '123',
      data_nascimento: '2000-01-01',
    });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toBe('E-mail já cadastrado');
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