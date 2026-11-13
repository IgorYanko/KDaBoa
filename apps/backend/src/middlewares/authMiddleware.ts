import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  // Pega o token do cabeçalho da requisição
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    return;
  }

  // O padrão do mercado é enviar "Bearer <token>", então separamos a string
  const token = authHeader.split(' ')[1];

  try {
    // Tenta decodificar usando a mesma chave secreta do seu .env
    const decodificado = jwt.verify(token, process.env.JWT_SECRET as string);
    
    // Injeta os dados do usuário na requisição para o controller poder usar depois
    (req as any).usuario = decodificado;
    
    // Libera a passagem para a rota final!
    next(); 
  } catch (error) {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};