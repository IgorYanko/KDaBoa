import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LayoutApp } from './components/LayoutApp';
import { RotaPrivada, RotaPublica } from './components/RotaPrivada';
import { TelaEmConstrucao } from './components/TelaEmConstrucao';
import { AuthProvider } from './contexts/AuthContext';
import { Cadastro } from './pages/Cadastro/Cadastro';
import { Login } from './pages/Login/Login';
import { Perfil } from './pages/Perfil/Perfil';

/** Rotas do app. */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route element={<RotaPublica />}>
            <Route element={<LayoutApp />}>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
            </Route>
          </Route>
          <Route element={<LayoutApp />}>
            <Route path="/redefinir-senha" element={<TelaEmConstrucao titulo="Redefinir senha" issue={19} />} />
          </Route>

          {/* Privadas (#21) */}
          <Route element={<RotaPrivada />}>
            <Route element={<LayoutApp comBarra />}>
              <Route path="/inicio" element={<TelaEmConstrucao titulo="Início" issue={22} />} />
              <Route path="/agenda" element={<TelaEmConstrucao titulo="Minha agenda" issue={38} />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
            <Route element={<LayoutApp />}>
              <Route path="/eventos/:id" element={<TelaEmConstrucao titulo="Detalhe do evento" issue={26} />} />
              <Route path="/eventos/:id/mapa" element={<TelaEmConstrucao titulo="Mapa do evento" issue={24} />} />
              <Route path="/eventos/:id/chat" element={<TelaEmConstrucao titulo="Chat do evento" issue={32} />} />
              <Route path="/eventos/:id/quem-vai" element={<TelaEmConstrucao titulo="Quem vai" issue={30} />} />
              <Route path="/divulgar" element={<TelaEmConstrucao titulo="Divulgar evento" issue={43} />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
