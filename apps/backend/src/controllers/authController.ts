import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { enviarEmailRecuperacao } from '../services/emailService';
import { apenasDigitosCnpj, cnpjValido } from '../utils/cnpj';

const HASH_SENHA_AUSENTE = '$2b$10$yB1lgsogYiGFZGz8oLDTU.KK2np7oXCVK53.M7qUOxiKDrUkrTOHW';
const MENSAGEM_RECUPERACAO = 'E-mail de recuperação enviado com sucesso';

function segredoJwt(): string {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    throw new Error('JWT_SECRET não configurada');
  }
  return segredo;
}

function gerarHashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const cadastrar = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nome,
      email,
      senha,
      data_nascimento,
      dataNascimento,
      mostrar_presenca,
      mostrarPresenca,
      interesses,
      tipo,
      cnpj,
      nome_fantasia,
      nomeFantasia,
    } = req.body;

    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExiste) {
      res.status(400).json({ erro: 'E-mail já cadastrado' });
      return;
    }

    const contaEmpresa = tipo === 'cnpj';
    let cnpjLimpo: string | null = null;
    if (contaEmpresa) {
      if (typeof nome !== 'string' || !nome.trim()) {
        res.status(400).json({ erro: 'Informe a razão social.' });
        return;
      }
      if (typeof senha !== 'string' || senha.length < 8 || senha.length > 128) {
        res.status(400).json({ erro: 'A senha deve ter entre 8 e 128 caracteres' });
        return;
      }
      cnpjLimpo = apenasDigitosCnpj(String(cnpj ?? ''));
      if (!cnpjValido(cnpjLimpo)) {
        res.status(400).json({ erro: 'CNPJ inválido.' });
        return;
      }
      const cnpjExiste = await prisma.usuario.findUnique({ where: { cnpj: cnpjLimpo } });
      if (cnpjExiste) {
        res.status(400).json({ erro: 'CNPJ já cadastrado' });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const dataNasc = dataNascimento || data_nascimento || '2000-01-01';
    const presencaVisivel = mostrarPresenca ?? mostrar_presenca ?? true;

    const listaInteresses = Array.isArray(interesses)
      ? interesses.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
      : [];

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        perfil: contaEmpresa ? 'ORGANIZADOR' : 'USUARIO',
        dataNascimento: contaEmpresa ? null : new Date(dataNasc),
        cnpj: cnpjLimpo,
        nomeFantasia: contaEmpresa ? (nomeFantasia || nome_fantasia || null) : null,
        mostrarPresenca: Boolean(presencaVisivel),
        ...(listaInteresses.length > 0 && {
          interesses: {
            create: listaInteresses.map((categoriaId) => ({
              categoriaId,
            })),
          },
        }),
      },
      include: {
        interesses: true,
      },
    });

    res.status(201).json({
      mensagem: 'Usuário criado com sucesso!',
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        perfil: novoUsuario.perfil ?? 'USUARIO',
        cnpj: novoUsuario.cnpj,
        nome_fantasia: novoUsuario.nomeFantasia,
        data_nascimento: novoUsuario.dataNascimento,
        mostrar_presenca: novoUsuario.mostrarPresenca,
        interesses: novoUsuario.interesses
          ? novoUsuario.interesses.map((i) => i.categoriaId)
          : listaInteresses,
      },
    });
  } catch (_error) {
    res.status(500).json({ erro: 'Erro interno ao cadastrar usuário' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    const senhaValida = await bcrypt.compare(
      senha,
      usuario?.senhaHash ?? HASH_SENHA_AUSENTE,
    );

    if (!usuario || !senhaValida) {
      res.status(401).json({ erro: 'Credenciais inválidas' });
      return;
    }

    const perfil = usuario.perfil ?? 'USUARIO';

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, perfil },
      segredoJwt(),
      { expiresIn: '2h' },
    );

    res.json({
      mensagem: 'Login bem-sucedido',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, perfil },
    });
  } catch (_error) {
    res.status(500).json({ erro: 'Erro interno ao fazer login' });
  }
};

export const solicitarRecuperacaoSenha = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ erro: 'E-mail é obrigatório' });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim() },
    });

    if (!usuario) {
      await bcrypt.compare(email, HASH_SENHA_AUSENTE);
      res.status(200).json({ mensagem: MENSAGEM_RECUPERACAO });
      return;
    }

    const agora = new Date();
    const tokenPuro = crypto.randomBytes(32).toString('hex');
    const tokenHash = gerarHashToken(tokenPuro);
    const expiraEm = new Date(agora.getTime() + 60 * 60 * 1000);

    await prisma.tokenRedefinicaoSenha.updateMany({
      where: {
        usuarioId: usuario.id,
        usadoEm: null,
      },
      data: {
        usadoEm: agora,
      },
    });

    const novoToken = await prisma.tokenRedefinicaoSenha.create({
      data: {
        usuarioId: usuario.id,
        tokenHash,
        expiraEm,
      },
    });

    try {
      await enviarEmailRecuperacao(usuario.email, tokenPuro);
    } catch (erroEnvio) {
      await prisma.tokenRedefinicaoSenha.delete({
        where: { id: novoToken.id },
      });
      throw erroEnvio;
    }

    res.status(200).json({
      mensagem: MENSAGEM_RECUPERACAO,
    });
  } catch (_error) {
    res.status(500).json({ erro: 'Erro ao solicitar recuperação de senha' });
  }
};

export const redefinirSenha = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, novaSenha, senha } = req.body;
    const senhaFinal = novaSenha ?? senha;

    if (!token || typeof senhaFinal !== 'string' || !senhaFinal) {
      res.status(400).json({ erro: 'Token e nova senha são obrigatórios' });
      return;
    }

    if (senhaFinal.length < 8 || senhaFinal.length > 128) {
      res.status(400).json({ erro: 'A senha deve ter entre 8 e 128 caracteres' });
      return;
    }

    const tokenHash = gerarHashToken(String(token));
    const agora = new Date();

    const registroToken = await prisma.tokenRedefinicaoSenha.findUnique({
      where: { tokenHash },
    });

    if (
      !registroToken ||
      registroToken.usadoEm !== null ||
      registroToken.expiraEm <= agora
    ) {
      res.status(400).json({ erro: 'Token inválido, expirado ou já utilizado' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaFinal, salt);

    const trocou = await prisma.$transaction(async (tx) => {
      const consumido = await tx.tokenRedefinicaoSenha.updateMany({
        where: {
          id: registroToken.id,
          usadoEm: null,
          expiraEm: { gt: agora },
        },
        data: { usadoEm: agora },
      });

      if (consumido.count !== 1) {
        return false;
      }

      await tx.usuario.update({
        where: { id: registroToken.usuarioId },
        data: { senhaHash },
      });

      return true;
    });

    if (!trocou) {
      res.status(400).json({ erro: 'Token inválido, expirado ou já utilizado' });
      return;
    }

    res.status(200).json({ mensagem: 'Senha redefinida com sucesso' });
  } catch (_error) {
    res.status(500).json({ erro: 'Erro ao redefinir senha' });
  }
};