import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../contexts/useAuth';

/** Só deixa passar com sessão; sem sessão, manda para o login (issue #21). */
export function RotaPrivada() {
  const { logado } = useAuth();
  const local = useLocation();
  if (!logado) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  return <Outlet />;
}

/** Telas de login/cadastro: quem já está logado vai direto para o Início. */
export function RotaPublica() {
  const { logado } = useAuth();
  if (logado) return <Navigate to="/inicio" replace />;
  return <Outlet />;
}
