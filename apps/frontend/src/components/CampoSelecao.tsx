import { type SelectHTMLAttributes, useId } from 'react';
import styles from './Campo.module.css';
import { Icone } from './Icone';

export interface OpcaoSelecao {
  valor: string;
  rotulo: string;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  rotulo: string;
  opcoes: OpcaoSelecao[];
  /** Texto da opção vazia (ex.: "Escolha o local"). */
  marcador?: string;
  erro?: string;
}

/** Rótulo + lista de opções (mesmo visual do Campo). */
export function CampoSelecao({ rotulo, opcoes, marcador, erro, id, className, value, ...props }: Props) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;
  const vazio = value === '' || value === undefined;

  const classes = [styles.input, styles.selecao, vazio && styles.selecaoVazia, erro && styles.invalido]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className ? `${styles.campo} ${className}` : styles.campo}>
      <label htmlFor={idCampo} className={styles.rotulo}>
        {rotulo}
      </label>
      <div className={styles.caixa}>
        <select
          id={idCampo}
          className={classes}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          value={value}
          {...props}
        >
          {marcador && (
            <option value="" disabled>
              {marcador}
            </option>
          )}
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
        <span className={styles.seta}>
          <Icone nome="seta-direita" tamanho={18} />
        </span>
      </div>
      {erro && (
        <p id={idErro} className={styles.erro}>
          <Icone nome="alerta" tamanho={14} />
          {erro}
        </p>
      )}
    </div>
  );
}
