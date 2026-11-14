import crypto from 'crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const estadoMock = {
  senhaHashAtual: bcrypt.hashSync('senha_antiga_123', 10),
  tokens: [] as Array<{
    id: string;
    usuarioId: string;
    tokenHash: string;
    expiraEm: Date;
    usadoEm: Date | null;
  }>,
  ultimoTokenEnviado: '',
};

vi.mock('nodemailer', () => ({
  default: {
    createTestAccount: vi.fn().mockResolvedValue({
      smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
      user: 'teste@ethereal.email',
      pass: 'senha_teste',
    }),
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockImplementation((mailOptions) => {
        const match = String(mailOptions.text).match(/token:\s*([a-f0-9]+)/i);
        if (match) {
          estadoMock.ultimoTokenEnviado = match[1];
        }
        return Promise.resolve({ messageId: 'msg-123' });
      }),
    }),
    getTestMessageUrl: vi.fn().mockReturnValue('https://ethereal.email/message/123'),
  },
}));

vi.mock('../prisma', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn().mockImplementation(({ where: { email } }) => {
        if (email === 'joao@kdaboa.com') {
          return Promise.resolve({
            id: '123e4567-e89b-12d3-a456-426614174000',
            nome: 'João Pedro',
            email: 'joao@kdaboa.com',
            senhaHash: estadoMock.senhaHashAtual,
          });
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation(({ data }) => {
        if (data.senhaHash) {
          estadoMock.senhaHashAtual = data.senhaHash;
        }
        return Promise.resolve({
          id: '123e4567-e89b-12d3-a456-426614174000',
          senhaHash: estadoMock.senhaHashAtual,
        });
      }),
    },
    tokenRedefinicaoSenha: {
      create: vi.fn().mockImplementation(({ data }) => {
        const novo = {
          id: 'token-uuid-' + (estadoMock.tokens.length + 1),
          usuarioId: data.usuarioId,
          tokenHash: data.tokenHash,
          expiraEm: data.expiraEm,
          usadoEm: null,
        };
        estadoMock.tokens.push(novo);
        return Promise.resolve(novo);
      }),
      findUnique: vi.fn().mockImplementation(({ where: { tokenHash } }) => {
        const encontrado = estadoMock.tokens.find((t) => t.tokenHash === tokenHash);
        return Promise.resolve(encontrado || null);
      }),
      update: vi.fn().mockImplementation(({ where: { id }, data }) => {
        const encontrado = estadoMock.tokens.find((t) => t.id === id);
        if (encontrado && data.usadoEm) {
          encontrado.usadoEm = data.usadoEm;
        }
        return Promise.resolve(encontrado);
      }),
    },
  },
}));

import app from '../app';

describe('Recuperação de senha por e-mail (#18)', () => {
  it('1. Recebe o e-mail e dispara a mensagem de redefinição com token único via Nodemailer', async () => {
    const res = await request(app)
      .post('/api/usuarios/esqueci-senha')
      .send({ email: 'joao@kdaboa.com' });

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe('E-mail de recuperação enviado com sucesso');
    expect(estadoMock.ultimoTokenEnviado).toHaveLength(64);
    expect(estadoMock.tokens).toHaveLength(1);
  });

  it('2. Token válido grava a nova senha', async () => {
    const res = await request(app)
      .post('/api/usuarios/redefinir-senha')
      .send({
        token: estadoMock.ultimoTokenEnviado,
        novaSenha: 'nova_senha_super_segura',
      });

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe('Senha redefinida com sucesso');
  });

  it('3. Token já usado é recusado', async () => {
    const res = await request(app)
      .post('/api/usuarios/redefinir-senha')
      .send({
        token: estadoMock.ultimoTokenEnviado,
        novaSenha: 'outra_tentativa_senha',
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Token inválido, expirado ou já utilizado');
  });

  it('4. Token expirado é recusado', async () => {
    const tokenExpiradoPuro = 'token_expirado_teste_123';
    const tokenHash = crypto
      .createHash('sha256')
      .update(tokenExpiradoPuro)
      .digest('hex');

    estadoMock.tokens.push({
      id: 'token-expirado-id',
      usuarioId: '123e4567-e89b-12d3-a456-426614174000',
      tokenHash,
      expiraEm: new Date(Date.now() - 3600 * 1000), // 1 hora no passado
      usadoEm: null,
    });

    const res = await request(app)
      .post('/api/usuarios/redefinir-senha')
      .send({
        token: tokenExpiradoPuro,
        novaSenha: 'senha_nao_deve_gravar',
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Token inválido, expirado ou já utilizado');
  });

  it('5. A senha nova serve para o login', async () => {
    const resLoginAntiga = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'joao@kdaboa.com', senha: 'senha_antiga_123' });
    expect(resLoginAntiga.status).toBe(401);

    const resLoginNova = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'joao@kdaboa.com', senha: 'nova_senha_super_segura' });
    expect(resLoginNova.status).toBe(200);
    expect(resLoginNova.body.token).toBeDefined();
  });
});