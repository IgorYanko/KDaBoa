import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface UsuarioToken extends JwtPayload {
  id: string;
  email: string;
  perfil: 'USUARIO' | 'ORGANIZADOR' | 'ADMIN';
}

export interface RequisicaoAutenticada extends Request {
  usuario?: UsuarioToken;
}

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodificado = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as UsuarioToken;

    (req as RequisicaoAutenticada).usuario = decodificado;
    next();
  } catch (_error) {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

export const exigirPerfil = (...perfisPermitidos: Array<'USUARIO' | 'ORGANIZADOR' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const usuario = (req as RequisicaoAutenticada).usuario;

    if (!usuario) {
      res.status(401).json({ erro: 'Usuário não autenticado.' });
      return;
    }

    if (!perfisPermitidos.includes(usuario.perfil)) {
      res.status(403).json({ erro: 'Acesso proibido. Permissão insuficiente.' });
      return;
    }

    next();
  };
};