import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type UsuarioSalvo = {
  id: string;
  email: string;
  cnpj?: string | null;
  perfil?: string;
};

const usuarios = vi.hoisted(() => [] as UsuarioSalvo[]);

vi.mock('../prisma', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string; cnpj?: string } }) => {
        return (
          usuarios.find((usuario) => {
            if (where.email) return usuario.email === where.email;
            if (where.cnpj) return usuario.cnpj === where.cnpj;
            return false;
          }) ?? null
        );
      }),
      create: vi.fn(async ({ data }: { data: UsuarioSalvo & { nome: string; nomeFantasia?: string } }) => {
        const novo = {
          id: 'uuid-organizador',
          interesses: [],
          ...data,
        };
        usuarios.push(novo);
        return novo;
      }),
    },
  },
}));

import app from '../app';

const CNPJ_VALIDO = '11444777000161';

describe('Cadastro de conta CNPJ', () => {
  beforeEach(() => {
    usuarios.length = 0;
  });

  it('cria organizador quando o CNPJ é válido', async () => {
    const resposta = await request(app).post('/api/auth/cadastro').send({
      tipo: 'cnpj',
      nome: 'Casa de Show Ltda',
      nome_fantasia: 'Casa de Show',
      email: 'casa@kdaboa.com',
      senha: 'senha_segura',
      cnpj: '11.444.777/0001-61',
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.perfil).toBe('ORGANIZADOR');
    expect(resposta.body.usuario.cnpj).toBe(CNPJ_VALIDO);
    expect(resposta.body.usuario.nome_fantasia).toBe('Casa de Show');
  });

  it('recusa CNPJ inválido', async () => {
    const resposta = await request(app).post('/api/auth/cadastro').send({
      tipo: 'cnpj',
      nome: 'Empresa',
      email: 'ruim@kdaboa.com',
      senha: 'senha_segura',
      cnpj: '11444777000162',
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('CNPJ inválido.');
  });

  it('recusa CNPJ repetido', async () => {
    await request(app).post('/api/auth/cadastro').send({
      tipo: 'cnpj',
      nome: 'Casa de Show Ltda',
      email: 'casa@kdaboa.com',
      senha: 'senha_segura',
      cnpj: CNPJ_VALIDO,
    });

    const resposta = await request(app).post('/api/auth/cadastro').send({
      tipo: 'cnpj',
      nome: 'Outra Casa',
      email: 'outra@kdaboa.com',
      senha: 'senha_segura',
      cnpj: CNPJ_VALIDO,
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('CNPJ já cadastrado');
  });
});
