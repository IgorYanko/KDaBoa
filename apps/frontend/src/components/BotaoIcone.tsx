import type { ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router';
import styles from './BotaoIcone.module.css';
import { Icone, type NomeIcone } from './Icone';

export type VarianteBotaoIcone = 'superficie' | 'contorno' | 'vidro' | 'fantasma';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icone: NomeIcone;
  /** Nome lido pelos leitores de tela (obrigatório: o botão não tem texto). */
  rotulo: string;
  /**
   * superficie = fundo de card · contorno = só a borda · vidro = translúcido (sobre imagens/cores)
   * · fantasma = sem fundo nem borda.
   */
  variante?: VarianteBotaoIcone;
  /** Se informado, vira um link para esta rota. */
  para?: string;
}

/** Botão quadrado só com ícone (voltar, compartilhar, divulgar...). */
export function BotaoIcone({ icone, rotulo, variante = 'superficie', para, className, type = 'button', ...props }: Props) {
  const classes = [styles.botao, styles[variante], className].filter(Boolean).join(' ');
  if (para) {
    return (
      <Link to={para} className={classes} aria-label={rotulo}>
        <Icone nome={icone} />
      </Link>
    );
  }
  return (
    <button type={type} className={classes} aria-label={rotulo} {...props}>
      <Icone nome={icone} />
    </button>
  );
}
