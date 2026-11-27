import type { CSSProperties } from 'react';
import { BotaoIcone } from '../../components/BotaoIcone';
import type { ParticipanteDTO } from '../../dtos';
import { corDoAvatar, iniciais } from '../../utils/cores';
import styles from './QuemVai.module.css';

interface Props {
  pessoa: ParticipanteDTO;
  /** Posição na lista completa: define a cor do avatar (não muda ao buscar). */
  posicao: number;
  /** É o próprio usuário logado: mostra "Você" no lugar do botão. */
  eu: boolean;
  /** Seguir/deixar de seguir em andamento. */
  ocupado: boolean;
  /** Os dois se seguem: mostra o atalho para a conversa (chat mútuo). */
  podeConversar?: boolean;
  onAlternarSeguir: () => void;
}

/** Uma pessoa na lista Quem vai: avatar, nome, @apelido e o botão seguir. */
export function PessoaLinha({ pessoa, posicao, eu, ocupado, podeConversar = false, onAlternarSeguir }: Props) {
  const estilo = { '--cor-avatar': corDoAvatar(posicao) } as CSSProperties;
  return (
    <li className={styles.pessoa}>
      <span className={styles.avatar} style={estilo} aria-hidden="true">
        {iniciais(pessoa.nome)}
      </span>
      <span className={styles.identidade}>
        <span className={styles.nome}>{pessoa.nome}</span>
        {pessoa.apelido && <span className={styles.apelido}>@{pessoa.apelido}</span>}
      </span>
      {!eu && podeConversar && (
        <BotaoIcone icone="chat" rotulo={`Conversar com ${pessoa.nome}`} variante="fantasma" para={`/conversas/${pessoa.id}`} />
      )}
      {eu ? (
        <span className={styles.voce}>Você</span>
      ) : (
        <button
          type="button"
          className={pessoa.seguindo ? `${styles.seguir} ${styles.seguindo}` : styles.seguir}
          aria-pressed={pessoa.seguindo}
          aria-label={`${pessoa.seguindo ? 'Deixar de seguir' : 'Seguir'} ${pessoa.nome}`}
          disabled={ocupado}
          onClick={onAlternarSeguir}
        >
          {pessoa.seguindo ? 'Seguindo' : 'Seguir'}
        </button>
      )}
    </li>
  );
}
