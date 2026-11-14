import type { ButtonHTMLAttributes } from 'react';
import styles from './BotaoEnviar.module.css';
import { LOGO_ESCOLHIDA, Logo } from './Logo';

/**
 * Botão de enviar mensagem do chat, com a logo do KdABoa.
 * Com a logo de pin, ela gira para a ponta apontar para a direita, como uma seta de "enviar".
 */
export function BotaoEnviar({ className, type = 'submit', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={className ? `${styles.botao} ${className}` : styles.botao}
      aria-label="Enviar mensagem"
      {...props}
    >
      <Logo tamanho={24} className={LOGO_ESCOLHIDA === 'pin' ? styles.girada : undefined} />
    </button>
  );
}
