import { Outlet } from 'react-router';
import { BarraInferior } from './BarraInferior';
import { BarraTopo } from './BarraTopo';
import styles from './LayoutApp.module.css';

interface Props {
  /** Mostra a navegação principal (barra inferior no celular, barra do topo no desktop). */
  comBarra?: boolean;
}

/** Moldura das telas: coluna centralizada e, com `comBarra`, a navegação principal. */
export function LayoutApp({ comBarra = false }: Props) {
  return (
    <div className={styles.moldura}>
      {comBarra && <BarraTopo />}
      <div className={comBarra ? `${styles.app} ${styles.comBarra}` : styles.app}>
        <Outlet />
      </div>
      {comBarra && <BarraInferior />}
    </div>
  );
}
