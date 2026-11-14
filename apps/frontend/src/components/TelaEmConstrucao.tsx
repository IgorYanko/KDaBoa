import { Icone } from './Icone';
import styles from './TelaEmConstrucao.module.css';

interface Props {
  titulo: string;
  /** Issue do GitHub que vai implementar a tela. */
  issue: number;
}

/** Tela provisória para as rotas que ainda não foram implementadas. */
export function TelaEmConstrucao({ titulo, issue }: Props) {
  return (
    <main className={styles.tela}>
      <span className={styles.icone}>
        <Icone nome="brilho" tamanho={24} />
      </span>
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.texto}>Essa tela está sendo preparada e chega em breve (issue #{issue}).</p>
    </main>
  );
}
