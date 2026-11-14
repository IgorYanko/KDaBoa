import { Logo, type VarianteLogo } from './Logo';
import styles from './Marca.module.css';

interface Props {
  /** sm = barra do topo · md = login · lg = painel da marca no desktop. */
  tamanho?: 'sm' | 'md' | 'lg';
  /** Mostra o nome ao lado do símbolo (padrão: sim). */
  comNome?: boolean;
  /** Proposta de logo (padrão: a escolhida em Logo.tsx). */
  variante?: VarianteLogo;
}

const PIXELS = { sm: 28, md: 36, lg: 48 };

/** Símbolo + nome do KdABoa ("KdABoa" + "?" em limão). Decorativo: quem usa dá o nome acessível. */
export function Marca({ tamanho = 'md', comNome = true, variante }: Props) {
  return (
    <span className={`${styles.marca} ${styles[tamanho]}`} aria-hidden="true">
      <Logo tamanho={PIXELS[tamanho]} variante={variante} className={styles.simbolo} />
      {comNome && (
        <span className={styles.nome}>
          KdABoa<span className={styles.interrogacao}>?</span>
        </span>
      )}
    </span>
  );
}
