import { Aviso } from './Aviso';
import { Botao } from './Botao';
import styles from './ConfirmarExclusao.module.css';
import { Modal } from './Modal';

interface Props {
  aberto: boolean;
  titulo: string;
  texto: string;
  /** Erro da API (ex.: "Este local tem eventos"); a janela continua aberta. */
  erro: string | null;
  excluindo: boolean;
  aoConfirmar: () => void;
  aoFechar: () => void;
}

/** Janela "Excluir X?" com Cancelar e Excluir (em vermelho). */
export function ConfirmarExclusao({ aberto, titulo, texto, erro, excluindo, aoConfirmar, aoFechar }: Props) {
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} idTitulo="titulo-confirmar-exclusao">
      <div className={styles.corpo}>
        <h2 id="titulo-confirmar-exclusao" className={styles.titulo}>
          {titulo}
        </h2>
        <p className={styles.texto}>{texto}</p>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <div className={styles.botoes}>
          <Botao variante="secundario" onClick={aoFechar} disabled={excluindo}>
            Cancelar
          </Botao>
          <Botao carregando={excluindo} onClick={aoConfirmar} className={styles.excluir}>
            Excluir
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
