import styles from './Segmentos.module.css';

interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
}

interface Props<T extends string> {
  rotulo: string;
  opcoes: Opcao<T>[];
  /** Opção marcada; null = nenhuma. */
  selecionado: T | null;
  /** Tocar na opção já marcada desmarca (null). */
  onMudar: (valor: T | null) => void;
}

/** Botões lado a lado em que só um fica marcado (ex.: Hoje / Fim de semana / Este mês). */
export function Segmentos<T extends string>({ rotulo, opcoes, selecionado, onMudar }: Props<T>) {
  return (
    <fieldset className={styles.grupo}>
      <legend className={styles.legenda}>{rotulo}</legend>
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === selecionado;
        return (
          <button
            key={opcao.valor}
            type="button"
            className={ativo ? `${styles.opcao} ${styles.ativo}` : styles.opcao}
            aria-pressed={ativo}
            onClick={() => onMudar(ativo ? null : opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </fieldset>
  );
}
