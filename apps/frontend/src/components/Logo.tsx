import type { ReactNode } from 'react';

/**
 * Símbolo do KdABoa. Três propostas; a escolhida fica em LOGO_ESCOLHIDA.
 *
 * - pin:   pin de localização com um brilho dentro — "cadê a boa?" (onde está o rolê bom).
 * - balao: balão de conversa com um "?" — a pergunta que dá nome ao app, e o chat da galera.
 * - sinal: pin emitindo ondas — "o que está rolando agora, perto de você".
 *
 * Cores: o corpo usa a cor do texto (currentColor, normalmente o limão) e o detalhe
 * interno usa --logo-detalhe (padrão: a cor de texto sobre o limão).
 */
export type VarianteLogo = 'pin' | 'balao' | 'sinal';

/** Proposta usada no app (marca, favicon e botão de enviar do chat). */
export const LOGO_ESCOLHIDA: VarianteLogo = 'pin';

const DETALHE = 'var(--logo-detalhe, var(--cor-sobre-primaria))';

const desenhos: Record<VarianteLogo, ReactNode> = {
  pin: (
    <>
      <path
        fill="currentColor"
        d="M16 2.5C9.6 2.5 4.5 7.5 4.5 13.7c0 7.9 9.4 14.6 10.6 15.5a1.5 1.5 0 0 0 1.8 0c1.2-.9 10.6-7.6 10.6-15.5C27.5 7.5 22.4 2.5 16 2.5z"
      />
      <path
        fill={DETALHE}
        d="M16 7.4c.55 3.3 2.7 5.45 6 6-3.3.55-5.45 2.7-6 6-.55-3.3-2.7-5.45-6-6 3.3-.55 5.45-2.7 6-6z"
      />
    </>
  ),
  balao: (
    <>
      <path
        fill="currentColor"
        d="M8 3.5h16a4.5 4.5 0 0 1 4.5 4.5v11a4.5 4.5 0 0 1-4.5 4.5h-7.2l-5.9 4.9a.9.9 0 0 1-1.5-.7v-4.2H8A4.5 4.5 0 0 1 3.5 19V8A4.5 4.5 0 0 1 8 3.5z"
      />
      <path
        fill="none"
        stroke={DETALHE}
        strokeWidth="2.6"
        strokeLinecap="round"
        d="M12.6 10.6a3.4 3.4 0 1 1 4.8 3.1c-.9.4-1.4 1-1.4 2v.4"
      />
      <circle fill={DETALHE} cx="16" cy="19.6" r="1.6" />
    </>
  ),
  sinal: (
    <>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M8.6 9.4a10.4 10.4 0 0 1 14.8 0M4.9 5.7a15.6 15.6 0 0 1 22.2 0"
      />
      <path
        fill="currentColor"
        d="M16 11.5c-4.1 0-7.5 3.2-7.5 7.2 0 5 6 9.4 6.8 10a1.2 1.2 0 0 0 1.4 0c.8-.6 6.8-5 6.8-10 0-4-3.4-7.2-7.5-7.2z"
      />
      <circle fill={DETALHE} cx="16" cy="18.6" r="2.6" />
    </>
  ),
};

interface Props {
  /** Tamanho em px (padrão 32). */
  tamanho?: number;
  variante?: VarianteLogo;
  className?: string;
}

/** Símbolo do KdABoa (decorativo; quem usa dá o nome acessível). */
export function Logo({ tamanho = 32, variante = LOGO_ESCOLHIDA, className }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      {desenhos[variante]}
    </svg>
  );
}
