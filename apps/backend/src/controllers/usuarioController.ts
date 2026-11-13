import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

export const usuarioController = {
  cadastrar: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nome, email, senha, data_nascimento, dataNascimento } = req.body;

      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email },
      });

      if (usuarioExistente) {
        res.status(400).json({ erro: 'E-mail já cadastrado' });
        return;
      }

      const senhaHash = await bcrypt.hash(senha || '123456', 10);
      const dataNasc = dataNascimento || data_nascimento || '2000-01-01';

      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senhaHash,
          dataNascimento: new Date(dataNasc),
        },
      });

      res.status(201).json({
        mensagem: 'Usuário cadastrado com sucesso!',
        usuario: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          data_nascimento: novoUsuario.dataNascimento,
        },
      });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, senha } = req.body;

      const usuario = await prisma.usuario.findUnique({
        where: { email },
      });

      if (!usuario) {
        res.status(401).json({ erro: 'E-mail ou senha inválidos' });
        return;
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
      if (!senhaValida) {
        res.status(401).json({ erro: 'E-mail ou senha inválidos' });
        return;
      }

      const secret = process.env.JWT_SECRET || 'kdaboa_chave_secreta_teste';
      const token = jwt.sign({ id: usuario.id, email: usuario.email }, secret, {
        expiresIn: '2h',
      });

      res.json({
        mensagem: 'Login realizado com sucesso',
        token,
        usuario: { id: usuario.id, nome: usuario.nome },
      });
    } catch (error) {
      res.status(500).json({ erro: 'Erro interno ao realizar login' });
    }
  },
};