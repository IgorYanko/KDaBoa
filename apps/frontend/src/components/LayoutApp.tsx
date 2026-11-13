import { Outlet } from 'react-router';
import { BarraInferior } from './BarraInferior';
import styles from './LayoutApp.module.css';

interface Props {
  /** Mostra a barra inferior (Início, Agenda e Perfil). */
  comBarra?: boolean;
}

/** Moldura de celular: centraliza a tela com 390px de largura máxima. */
export function LayoutApp({ comBarra = false }: Props) {
  return (
    <div className={comBarra ? `${styles.app} ${styles.comBarra}` : styles.app}>
      <Outlet />
      {comBarra && <BarraInferior />}
    </div>
  );
}
