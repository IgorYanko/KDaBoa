import type { ButtonHTMLAttributes } from 'react';
import styles from './Botao.module.css';
import { Icone, type NomeIcone } from './Icone';

export type VarianteBotao = 'primario' | 'secundario' | 'fantasma';

interface OpcoesEstilo {
  /** primario = limão (ação principal) · secundario = contorno · fantasma = só texto. */
  variante?: VarianteBotao;
  /** md = 48px (padrão) · sm = 40px. */
  tamanho?: 'md' | 'sm';
  /** Ocupa toda a largura (padrão: sim). */
  larguraTotal?: boolean;
}

/** Classes do botão, para usar também em links (`<Link className={classesBotao(...)}>`). */
export function classesBotao({ variante = 'primario', tamanho = 'md', larguraTotal = true }: OpcoesEstilo = {}): string {
  return [styles.botao, styles[variante], tamanho === 'sm' && styles.pequeno, larguraTotal && styles.larguraTotal]
    .filter(Boolean)
    .join(' ');
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement>, OpcoesEstilo {
  /** Mostra "Aguarde..." com um indicador e desabilita o botão. */
  carregando?: boolean;
  /** Ícone antes do texto. */
  icone?: NomeIcone;
}

/** Botão do app. Padrão: principal (limão), largura total. */
export function Botao({
  carregando,
  disabled,
  children,
  className,
  type = 'button',
  variante,
  tamanho,
  larguraTotal,
  icone,
  ...props
}: Props) {
  const classes = classesBotao({ variante, tamanho, larguraTotal });
  return (
    <button
      type={type}
      className={className ? `${classes} ${className}` : classes}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {carregando ? (
        <>
          <span className={styles.indicador} aria-hidden="true" />
          Aguarde...
        </>
      ) : (
        <>
          {icone && <Icone nome={icone} tamanho={tamanho === 'sm' ? 16 : 18} />}
          {children}
        </>
      )}
    </button>
  );
}
