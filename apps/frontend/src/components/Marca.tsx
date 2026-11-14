import { Icone } from './Icone';
import styles from './Marca.module.css';

interface Props {
  /** sm = barra do topo · md = login · lg = painel da marca no desktop. */
  tamanho?: 'sm' | 'md' | 'lg';
  /** Mostra o nome ao lado do símbolo (padrão: sim). */
  comNome?: boolean;
}

/** Símbolo + nome do KdABoa. Decorativo: quem usa dá o nome acessível (ex.: aria-label do link). */
export function Marca({ tamanho = 'md', comNome = true }: Props) {
  return (
    <span className={`${styles.marca} ${styles[tamanho]}`} aria-hidden="true">
      <span className={styles.simbolo}>
        <Icone nome="local" traco={2.25} className={styles.icone} />
      </span>
      {comNome && <span className={styles.nome}>KdABoa?</span>}
    </span>
  );
}
