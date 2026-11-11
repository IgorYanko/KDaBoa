import { Request, Response } from 'express';

// Mock simulando o banco de dados de usuários
const usuariosMock = [
  {
    id: "987fcdeb-51a2-43d7-9012-345678901234",
    nome: "Kayo",
    email: "kayo@email.com",
    senha_hash: "hash_falso_aqui", 
    data_nascimento: "2000-01-01"
  }
];

export const usuarioController = {
  // Simula o Cadastro
  cadastrar: (req: Request, res: Response) => {
    const { nome, email, senha, data_nascimento } = req.body;
    
    // Na vida real, aqui o banco vai validar se o email já existe e criptografar a senha
    const novoUsuario = {
      id: "uuid-novo-usuario",
      nome,
      email,
      data_nascimento
    };

    res.status(201).json({ 
      mensagem: "Usuário cadastrado com sucesso!", 
      usuario: novoUsuario 
    });
  },

  // Simula o Login
  login: (req: Request, res: Response) => {
    const { email, senha } = req.body;

    const usuario = usuariosMock.find(u => u.email === email);

    // Simplificação para o teste do mock
    if (!usuario || email !== "kayo@email.com") {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    // Retorna um token falso para o front conseguir simular que está logado
    res.json({ 
      mensagem: "Login realizado com sucesso", 
      token: "jwt_falso_para_liberar_telas_do_front",
      usuario: { id: usuario.id, nome: usuario.nome }
    });
  }
};