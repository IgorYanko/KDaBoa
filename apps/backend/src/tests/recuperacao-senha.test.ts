import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const estadoMock = vi.hoisted(() => ({
  senhaHashAtual: '',
  falharEnvioEmail: false,
  tokens: [] as Array<{
    id: string;
    usuarioId: string;
    tokenHash: string;
    expiraEm: Date;
    usadoEm: Date | null;
  }>,
  ultimoTokenEnviado: '',
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockImplementation((mailOptions) => {
        if (estadoMock.falharEnvioEmail) {
          return Promise.reject(new Error('Falha SMTP'));
        }
        const match = String(mailOptions.text).match(/token:\s*([a-f0-9]+)/i);
        if (match) {
          estadoMock.ultimoTokenEnviado = match[1];
        }
        return Promise.resolve({ messageId: 'msg-123' });
      }),
    }),
  },
}));

const prismaMock = vi.hoisted(() => {
  const operacoes = {
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
          id: `token-uuid-${estadoMock.tokens.length + 1}`,
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
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        for (const t of estadoMock.tokens) {
          const bateUsuario = !where.usuarioId || t.usuarioId === where.usuarioId;
          const bateId = !where.id || t.id === where.id;
          const bateUsado = where.usadoEm === null ? t.usadoEm === null : true;
          const bateExpira = where.expiraEm?.gt ? t.expiraEm > where.expiraEm.gt : true;

          if (bateUsuario && bateId && bateUsado && bateExpira) {
            t.usadoEm = data.usadoEm;
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
      delete: vi.fn().mockImplementation(({ where: { id } }) => {
        const idx = estadoMock.tokens.findIndex((t) => t.id === id);
        if (idx >= 0) {
          estadoMock.tokens.splice(idx, 1);
        }
        return Promise.resolve({});
      }),
    },
    $transaction: vi.fn(),
  };

  operacoes.$transaction.mockImplementation(async (fn: (tx: typeof operacoes) => unknown) =>
    fn(operacoes),
  );

  return operacoes;
});

vi.mock('../prisma', () => ({
  prisma: prismaMock,
}));

import app from '../app';

describe('Recuperação de senha por e-mail (#18)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    process.env.SMTP_HOST = 'smtp-relay.brevo.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'equipe@smtp-brevo.com';
    process.env.SMTP_PASS = 'chave_smtp_teste';
    process.env.SMTP_FROM = 'equipe.kdaboa@gmail.com';
    estadoMock.falharEnvioEmail = false;
    if (!estadoMock.senhaHashAtual) {
      estadoMock.senhaHashAtual = bcrypt.hashSync('senha_antiga_123', 10);
    }
  });

  it('1. Recebe o e-mail, invalida tokens anteriores e dispara mensagem sem expor previewUrl', async () => {
    const resSemEmail = await request(app).post('/api/auth/esqueci-senha').send({});
    expect(resSemEmail.status).toBe(400);

    await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'joao@kdaboa.com' });

    const res = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'joao@kdaboa.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      mensagem: 'E-mail de recuperação enviado com sucesso',
    });
    expect(res.body.previewUrl).toBeUndefined();
    expect(estadoMock.ultimoTokenEnviado).toHaveLength(64);
    expect(estadoMock.tokens[0].usadoEm).not.toBeNull();
    expect(estadoMock.tokens[1].usadoEm).toBeNull();
  });

  it('2. E-mail não cadastrado recebe o mesmo 200 e a mesma mensagem (sem enumeração)', async () => {
    const res = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'inexistente@kdaboa.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      mensagem: 'E-mail de recuperação enviado com sucesso',
    });
  });

  it('3. Se o envio SMTP falhar ou SMTP não estiver configurado, apaga o token criado e retorna 500', async () => {
    const qtdAntes = estadoMock.tokens.length;
    estadoMock.falharEnvioEmail = true;

    const resFalha = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'joao@kdaboa.com' });

    expect(resFalha.status).toBe(500);
    expect(estadoMock.tokens).toHaveLength(qtdAntes);

    delete process.env.SMTP_HOST;
    const resSemSmtp = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'joao@kdaboa.com' });

    expect(resSemSmtp.status).toBe(500);
    expect(estadoMock.tokens).toHaveLength(qtdAntes);
  });

  it('4. Recusa redefinição sem dados ou com senha fora do intervalo de 8 a 128 caracteres', async () => {
    const resVazio = await request(app).post('/api/auth/redefinir-senha').send({});
    expect(resVazio.status).toBe(400);

    const resCurta = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ token: estadoMock.ultimoTokenEnviado, novaSenha: 'curta' });

    expect(resCurta.status).toBe(400);
    expect(resCurta.body.erro).toContain('8 e 128');
  });

  it('5. Token válido grava a nova senha de forma atômica', async () => {
    await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'joao@kdaboa.com' });

    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({
        token: estadoMock.ultimoTokenEnviado,
        novaSenha: 'nova_senha_super_segura',
      });

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe('Senha redefinida com sucesso');
  });

  it('6. Token já usado ou expirado é recusado', async () => {
    const resUsado = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({
        token: estadoMock.ultimoTokenEnviado,
        novaSenha: 'outra_tentativa_senha',
      });

    expect(resUsado.status).toBe(400);

    const tokenExpiradoPuro = 'token_expirado_teste_123';
    const tokenHash = crypto
      .createHash('sha256')
      .update(tokenExpiradoPuro)
      .digest('hex');

    estadoMock.tokens.push({
      id: 'token-expirado-id',
      usuarioId: '123e4567-e89b-12d3-a456-426614174000',
      tokenHash,
      expiraEm: new Date(Date.now() - 3600 * 1000),
      usadoEm: null,
    });

    const resExpirado = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({
        token: tokenExpiradoPuro,
        novaSenha: 'senha_nao_deve_gravar',
      });

    expect(resExpirado.status).toBe(400);
  });

  it('7. A senha nova serve para o login e a antiga é recusada', async () => {
    const resLoginAntiga = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@kdaboa.com', senha: 'senha_antiga_123' });
    expect(resLoginAntiga.status).toBe(401);

    const resLoginNova = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@kdaboa.com', senha: 'nova_senha_super_segura' });
    expect(resLoginNova.status).toBe(200);
    expect(resLoginNova.body.token).toBeDefined();
  });
});