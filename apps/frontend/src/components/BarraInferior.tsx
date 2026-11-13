import { NavLink } from 'react-router';
import iconeAgenda from '../assets/icones/agenda.svg';
import iconeInicio from '../assets/icones/inicio.svg';
import iconePerfil from '../assets/icones/perfil.svg';
import styles from './BarraInferior.module.css';
import { IconeMascara } from './IconeMascara';

const itens = [
  { para: '/inicio', rotulo: 'Início', icone: iconeInicio },
  { para: '/agenda', rotulo: 'Agenda', icone: iconeAgenda },
  { para: '/perfil', rotulo: 'Perfil', icone: iconePerfil },
];

/** Barra de navegação principal (frame 3 do Figma). */
export function BarraInferior() {
  return (
    <nav className={styles.barra} aria-label="Navegação principal">
      {itens.map((item) => (
        <NavLink
          key={item.para}
          to={item.para}
          className={({ isActive }) => (isActive ? `${styles.item} ${styles.ativo}` : styles.item)}
        >
          <IconeMascara src={item.icone} tamanho={22} />
          <span>{item.rotulo}</span>
        </NavLink>
      ))}
    </nav>
  );
}
