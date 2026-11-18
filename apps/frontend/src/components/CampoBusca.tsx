import type { InputHTMLAttributes } from 'react';
import styles from './CampoBusca.module.css';
import { Icone } from './Icone';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Nome lido pelos leitores de tela (o campo não tem rótulo visível). */
  rotulo: string;
}

/** Campo de busca com lupa (tela Início). */
export function CampoBusca({ rotulo, className, ...props }: Props) {
  return (
    <div className={className ? `${styles.caixa} ${className}` : styles.caixa}>
      <span className={styles.lupa}>
        <Icone nome="busca" tamanho={18} />
      </span>
      <input type="search" aria-label={rotulo} className={styles.input} {...props} />
    </div>
  );
}
