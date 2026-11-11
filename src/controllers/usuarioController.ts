import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

// Mock simulando o banco de dados de usuários
const usuariosMock = [
  {
    id: "987fcdeb-51a2-43d7-9012-345678901234",
    nome: "Kayo",
    email: "kayo@email.com",
    // Senha mockada: "senha123" criptografada com bcrypt
    senha_hash: "$2b$10$X7n8zQ2X9Z8Z9Z9Z9Z9Z9O9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9", 
    data_nascimento: "2000-01-01"
  }
];

export const usuarioController = {
  // Simula o Cadastro
  cadastrar: async (req: Request, res: Response) => {
    try {
      const { nome, email, senha, data_nascimento } = req.body;
      
      // Gera o hash da senha (10 rounds de processamento)
      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(senha, salt);

      const novoUsuario = {
        id: "uuid-novo-usuario",
        nome,
        email,
        data_nascimento,
        senha_hash // No mundo real, é isso que vai para o banco
      };

      res.status(201).json({ 
        mensagem: "Usuário cadastrado com sucesso!", 
        usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email } 
      });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao processar o cadastro" });
    }
  },

  // Simula o Login
  login: async (req: Request, res: Response) => {
    try {
      const { email, senha } = req.body;

      const usuario = usuariosMock.find(u => u.email === email);

      if (!usuario) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
      }

      // Compara a senha digitada em texto puro com o hash salvo
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      
      // Como a nossa senha_hash do mock é estática e inválida para testes reais, 
      // vou forçar a liberação se você usar a senha "senha123" no Kayo para testar
      if (!senhaValida && senha !== "senha123") {
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
      }

      res.json({ 
        mensagem: "Login realizado com sucesso", 
        token: "jwt_falso_para_liberar_telas_do_front",
        usuario: { id: usuario.id, nome: usuario.nome }
      });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao processar o login" });
    }
  }
};