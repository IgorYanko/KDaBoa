import { Outlet } from 'react-router';
import { BarraInferior } from './BarraInferior';
import { BarraTopo } from './BarraTopo';
import styles from './LayoutApp.module.css';
import { PainelMarca } from './PainelMarca';

interface Props {
  /**
   * completa = barra inferior no celular + barra do topo no desktop (Início, Agenda, Perfil).
   * topo = só a barra do topo no desktop (telas com "voltar" próprio, como o detalhe).
   * nenhuma = sem navegação (login, cadastro, redefinir senha).
   */
  navegacao?: 'completa' | 'topo' | 'nenhuma';
  /** Login e cadastro: no desktop, a tela se divide entre o painel da marca e o formulário. */
  entrada?: boolean;
}

/** Moldura das telas: navegação principal e a largura do conteúdo. */
export function LayoutApp({ navegacao = 'nenhuma', entrada = false }: Props) {
  return (
    <div className={styles.moldura}>
      {navegacao !== 'nenhuma' && <BarraTopo />}

      {entrada ? (
        <div className={styles.entrada}>
          <div className={styles.painel}>
            <PainelMarca />
          </div>
          <div className={styles.formulario}>
            <Outlet />
          </div>
        </div>
      ) : (
        <div className={navegacao === 'completa' ? `${styles.app} ${styles.comBarra}` : styles.app}>
          <Outlet />
        </div>
      )}

      {navegacao === 'completa' && <BarraInferior />}
    </div>
  );
}
