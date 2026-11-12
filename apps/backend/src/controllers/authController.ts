import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Nosso "banco de dados" temporário na memória
const usuariosMock: any[] = [];

// Hash de custo 10 usado só para o login de e-mail inexistente levar o mesmo tempo.
const HASH_SENHA_AUSENTE = '$2b$10$yB1lgsogYiGFZGz8oLDTU.KK2np7oXCVK53.M7qUOxiKDrUkrTOHW';

function segredoJwt(): string {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    throw new Error('JWT_SECRET não configurada');
  }
  return segredo;
}

export const cadastrar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, senha } = req.body;

    // Verifica se o e-mail já existe no mock
    const usuarioExiste = usuariosMock.find(u => u.email === email);
    if (usuarioExiste) {
      res.status(400).json({ erro: 'E-mail já cadastrado' });
      return;
    }

    // Criptografa a senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Salva o usuário no nosso array mockado
    const novoUsuario = { id: usuariosMock.length + 1, nome, email, senha: senhaHash };
    usuariosMock.push(novoUsuario);

    res.status(201).json({ mensagem: 'Usuário criado com sucesso!', usuario: { id: novoUsuario.id, nome, email } });
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno ao cadastrar usuário' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha } = req.body;

    // Busca o usuário pelo e-mail. Sem usuário, compara contra um hash fixo
    // para a resposta não ficar mais rápida e revelar que o e-mail não existe.
    const usuario = usuariosMock.find(u => u.email === email);
    const senhaValida = await bcrypt.compare(senha, usuario?.senha ?? HASH_SENHA_AUSENTE);
    if (!usuario || !senhaValida) {
      res.status(401).json({ erro: 'Credenciais inválidas' });
      return;
    }

    // Gera o token de acesso válido por 2 horas
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, segredoJwt(), { expiresIn: '2h' });

    res.json({ mensagem: 'Login bem-sucedido', token, usuario: { id: usuario.id, nome: usuario.nome } });
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno ao fazer login' });
  }
};