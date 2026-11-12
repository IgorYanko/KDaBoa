import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../contexts/useAuth';

/** Só deixa passar com sessão; sem sessão, manda para o login (issue #21). */
export function RotaPrivada() {
  const { logado } = useAuth();
  const local = useLocation();
  if (!logado) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  return <Outlet />;
}

/** Telas de login/cadastro: quem já está logado vai para o Início (ou para a tela que tentou abrir). */
export function RotaPublica() {
  const { logado } = useAuth();
  const estado = useLocation().state as { de?: string } | null;
  if (logado) return <Navigate to={estado?.de ?? '/inicio'} replace />;
  return <Outlet />;
}
