import crypto from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { enviarEmailRecuperacao } from '../services/emailService';

const HASH_SENHA_AUSENTE = '$2b$10$yB1lgsogYiGFZGz8oLDTU.KK2np7oXCVK53.M7qUOxiKDrUkrTOHW';

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
    } = req.body;

    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExiste) {
      res.status(400).json({ erro: 'E-mail já cadastrado' });
      return;
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
        dataNascimento: new Date(dataNasc),
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
        data_nascimento: novoUsuario.dataNascimento,
        mostrar_presenca: novoUsuario.mostrarPresenca,
        interesses: novoUsuario.interesses
          ? novoUsuario.interesses.map((i) => i.categoriaId)
          : listaInteresses,
      },
    });
  } catch (error) {
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
      usuario?.senhaHash ?? HASH_SENHA_AUSENTE
    );

    if (!usuario || !senhaValida) {
      res.status(401).json({ erro: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      segredoJwt(),
      { expiresIn: '2h' }
    );

    res.json({
      mensagem: 'Login bem-sucedido',
      token,
      usuario: { id: usuario.id, nome: usuario.nome },
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno ao fazer login' });
  }
};

export const solicitarRecuperacaoSenha = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ erro: 'E-mail é obrigatório' });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      res.status(404).json({ erro: 'Usuário não encontrado' });
      return;
    }

    const tokenPuro = crypto.randomBytes(32).toString('hex');
    const tokenHash = gerarHashToken(tokenPuro);
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.tokenRedefinicaoSenha.create({
      data: {
        usuarioId: usuario.id,
        tokenHash,
        expiraEm,
      },
    });

    const resultadoEmail = await enviarEmailRecuperacao(usuario.email, tokenPuro);

    res.status(200).json({
      mensagem: 'E-mail de recuperação enviado com sucesso',
      previewUrl: resultadoEmail.previewUrl,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao solicitar recuperação de senha' });
  }
};

export const redefinirSenha = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, novaSenha, senha } = req.body;
    const senhaFinal = novaSenha || senha;

    if (!token || !senhaFinal) {
      res.status(400).json({ erro: 'Token e nova senha são obrigatórios' });
      return;
    }

    const tokenHash = gerarHashToken(String(token));

    const registroToken = await prisma.tokenRedefinicaoSenha.findUnique({
      where: { tokenHash },
    });

    if (
      !registroToken ||
      registroToken.usadoEm !== null ||
      registroToken.expiraEm < new Date()
    ) {
      res.status(400).json({ erro: 'Token inválido, expirado ou já utilizado' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaFinal, salt);

    await prisma.usuario.update({
      where: { id: registroToken.usuarioId },
      data: { senhaHash },
    });

    await prisma.tokenRedefinicaoSenha.update({
      where: { id: registroToken.id },
      data: { usadoEm: new Date() },
    });

    res.status(200).json({ mensagem: 'Senha redefinida com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao redefinir senha' });
  }
};