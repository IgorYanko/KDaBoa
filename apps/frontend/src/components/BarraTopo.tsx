import { Link, NavLink } from 'react-router';
import { useAuth } from '../contexts/useAuth';
import { iniciais } from '../utils/cores';
import styles from './BarraTopo.module.css';
import { classesBotao } from './Botao';
import { Icone } from './Icone';
import { itensNavegacao } from './itensNavegacao';
import { Marca } from './Marca';

/** Barra de navegação do desktop (a partir de 1024px; no celular fica a BarraInferior). */
export function BarraTopo() {
  const { usuario } = useAuth();

  return (
    <header className={styles.topo}>
      <div className={styles.conteudo}>
        <Link to="/inicio" className={styles.marca} aria-label="KdABoa? — início">
          <Marca tamanho="sm" />
        </Link>

        <nav className={styles.navegacao} aria-label="Navegação principal">
          {itensNavegacao.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              className={({ isActive }) => (isActive ? `${styles.item} ${styles.ativo}` : styles.item)}
            >
              <Icone nome={item.icone} tamanho={18} />
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        <div className={styles.acoes}>
          <Link to="/divulgar" className={classesBotao({ variante: 'secundario', tamanho: 'sm', larguraTotal: false })}>
            <Icone nome="mais" tamanho={16} />
            Divulgar evento
          </Link>
          {usuario && (
            <Link to="/perfil" className={styles.avatar} aria-label={`Perfil de ${usuario.nome}`}>
              {iniciais(usuario.nome)}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
