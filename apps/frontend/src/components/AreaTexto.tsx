import { type TextareaHTMLAttributes, useId } from 'react';
import styles from './Campo.module.css';
import { Icone } from './Icone';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo: string;
  erro?: string;
}

/** Rótulo + caixa de texto de várias linhas (mesmo visual do Campo), com contador quando há maxLength. */
export function AreaTexto({ rotulo, erro, id, maxLength, value, className, ...props }: Props) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;
  const tamanho = typeof value === 'string' ? value.length : 0;

  return (
    <div className={className ? `${styles.campo} ${className}` : styles.campo}>
      <div className={styles.rotuloLinha}>
        <label htmlFor={idCampo} className={styles.rotulo}>
          {rotulo}
        </label>
        {maxLength && (
          <span className={styles.contador} aria-hidden="true">
            {tamanho}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={idCampo}
        className={erro ? `${styles.input} ${styles.areaTexto} ${styles.invalido}` : `${styles.input} ${styles.areaTexto}`}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {erro && (
        <p id={idErro} className={styles.erro}>
          <Icone nome="alerta" tamanho={14} />
          {erro}
        </p>
      )}
    </div>
  );
}
