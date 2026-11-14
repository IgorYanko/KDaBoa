import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react';
import { BotaoIcone } from './BotaoIcone';
import styles from './Modal.module.css';

interface Props {
  aberto: boolean;
  /** Chamado ao fechar (botão X, tecla Esc ou toque fora do conteúdo). */
  aoFechar: () => void;
  /** id do título dentro do conteúdo (nome do diálogo para leitores de tela). */
  idTitulo: string;
  children: ReactNode;
}

/**
 * Janela sobre a tela, com o <dialog> nativo: prende o foco, fecha com Esc
 * e devolve o foco para onde estava ao fechar.
 */
export function Modal({ aberto, aoFechar, idTitulo, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  }, [aberto]);

  // Toque no fundo escurecido (fora do conteúdo) fecha.
  function aoClicar(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === dialogo.current) aoFechar();
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: o Esc já fecha o <dialog> nativo (evento onClose).
    <dialog ref={dialogo} className={styles.modal} aria-labelledby={idTitulo} onClose={aoFechar} onClick={aoClicar}>
      <div className={styles.conteudo}>
        <BotaoIcone icone="fechar" rotulo="Fechar" variante="fantasma" onClick={aoFechar} className={styles.fechar} />
        {children}
      </div>
    </dialog>
  );
}
