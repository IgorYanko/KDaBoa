import type { CSSProperties } from 'react';
import type { UsuarioResumoDTO } from '../dtos';
import { corDoAvatar, iniciais } from '../utils/cores';
import styles from './PilhaAvatares.module.css';

interface Props {
  pessoas: UsuarioResumoDTO[];
  /** Diâmetro de cada bolinha: 30 no card, 40 no detalhe. */
  tamanho?: 30 | 40;
  /** Quantas bolinhas mostrar no máximo. */
  maximo?: number;
}

/** Bolinhas sobrepostas com as iniciais de quem vai. Decorativas: o número ao lado é o que importa. */
export function PilhaAvatares({ pessoas, tamanho = 30, maximo = 3 }: Props) {
  if (pessoas.length === 0) return null;
  return (
    <span className={tamanho === 40 ? `${styles.pilha} ${styles.grande}` : styles.pilha} aria-hidden="true">
      {pessoas.slice(0, maximo).map((pessoa, posicao) => (
        <span key={pessoa.id} className={styles.avatar} style={{ '--cor-avatar': corDoAvatar(posicao) } as CSSProperties}>
          {iniciais(pessoa.nome)}
        </span>
      ))}
    </span>
  );
}
