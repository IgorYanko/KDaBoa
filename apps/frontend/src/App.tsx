import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LayoutApp } from './components/LayoutApp';
import { RotaPrivada, RotaPublica } from './components/RotaPrivada';
import { AuthProvider } from './contexts/AuthContext';
import { Agenda } from './pages/Agenda/Agenda';
import { Cadastro } from './pages/Cadastro/Cadastro';
import { Chat } from './pages/Chat/Chat';
import { Checkout } from './pages/Checkout/Checkout';
import { DetalheEvento } from './pages/DetalheEvento/DetalheEvento';
import { Divulgar } from './pages/Divulgar/Divulgar';
import { Inicio } from './pages/Inicio/Inicio';
import { Login } from './pages/Login/Login';
import { Mapa } from './pages/Mapa/Mapa';
import { Perfil } from './pages/Perfil/Perfil';
import { QuemVai } from './pages/QuemVai/QuemVai';
import { RedefinirSenha } from './pages/RedefinirSenha/RedefinirSenha';

/** Guia de estilo: só no `pnpm dev` (não entra no build de produção). */
const GuiaEstilo = import.meta.env.DEV
  ? lazy(() => import('./pages/GuiaEstilo/GuiaEstilo').then((m) => ({ default: m.GuiaEstilo })))
  : null;

/** Rotas do app. */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route element={<RotaPublica />}>
            <Route element={<LayoutApp entrada />}>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
            </Route>
          </Route>
          {/* Fora da RotaPublica: o link do e-mail precisa abrir mesmo com alguém logado. */}
          <Route element={<LayoutApp entrada />}>
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          </Route>

          {/* Privadas (#21) */}
          <Route element={<RotaPrivada />}>
            <Route element={<LayoutApp navegacao="completa" />}>
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
            <Route element={<LayoutApp navegacao="topo" />}>
              <Route path="/eventos/:id" element={<DetalheEvento />} />
              <Route path="/eventos/:id/checkout" element={<Checkout />} />
              <Route path="/eventos/:id/mapa" element={<Mapa />} />
              <Route path="/eventos/:id/chat" element={<Chat />} />
              <Route path="/eventos/:id/quem-vai" element={<QuemVai />} />
              <Route path="/divulgar" element={<Divulgar />} />
            </Route>
          </Route>

          {GuiaEstilo && (
            <Route
              path="/guia"
              element={
                <Suspense>
                  <GuiaEstilo />
                </Suspense>
              }
            />
          )}

          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
