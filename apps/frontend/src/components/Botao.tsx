import type { ButtonHTMLAttributes } from 'react';
import styles from './Botao.module.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Mostra "Aguarde..." e desabilita o botão. */
  carregando?: boolean;
}

/** Botão principal (verde-limão, largura total). */
export function Botao({ carregando, disabled, children, className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={className ? `${styles.botao} ${className}` : styles.botao}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {carregando ? 'Aguarde...' : children}
    </button>
  );
}
