import { NavLink } from 'react-router';
import styles from './BarraInferior.module.css';
import { Icone } from './Icone';
import { itensNavegacao } from './itensNavegacao';

/** Barra de navegação do celular (some no desktop, onde entra a BarraTopo). */
export function BarraInferior() {
  return (
    <nav className={styles.barra} aria-label="Navegação principal">
      {itensNavegacao.map((item) => (
        <NavLink
          key={item.para}
          to={item.para}
          className={({ isActive }) => (isActive ? `${styles.item} ${styles.ativo}` : styles.item)}
        >
          <span className={styles.icone}>
            <Icone nome={item.icone} tamanho={22} />
          </span>
          <span>{item.rotulo}</span>
        </NavLink>
      ))}
    </nav>
  );
}
