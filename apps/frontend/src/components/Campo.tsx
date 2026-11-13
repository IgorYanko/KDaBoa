import { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import styles from './Campo.module.css';

export interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  /** Mensagem de erro do campo (aparece embaixo e marca o input). */
  erro?: string;
  /** Algo dentro do input, à direita (ex.: botão de mostrar senha). */
  acessorio?: ReactNode;
  /** Altura menor (50px), usada no cadastro. */
  compacto?: boolean;
}

/** Rótulo + input no estilo do Figma. */
export function Campo({ rotulo, erro, acessorio, compacto, id, className, ...props }: CampoProps) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;

  const classesInput = [styles.input, compacto && styles.compacto, acessorio && styles.comAcessorio, erro && styles.invalido]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className ? `${styles.campo} ${className}` : styles.campo}>
      <label htmlFor={idCampo} className={styles.rotulo}>
        {rotulo}
      </label>
      <div className={styles.caixa}>
        <input
          id={idCampo}
          className={classesInput}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          {...props}
        />
        {acessorio && <div className={styles.acessorio}>{acessorio}</div>}
      </div>
      {erro && (
        <p id={idErro} className={styles.erro}>
          {erro}
        </p>
      )}
    </div>
  );
}
