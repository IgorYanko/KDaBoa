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
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.texto}>Tela em construção (issue #{issue}).</p>
    </main>
  );
}
