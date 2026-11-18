import { type ChangeEvent, type DragEvent, useEffect, useId, useState } from 'react';
import { TIPOS_IMAGEM, validarImagem } from '../utils/imagem';
import styles from './CampoImagem.module.css';
import { Icone } from './Icone';

interface Props {
  rotulo: string;
  arquivo: File | null;
  aoMudar: (arquivo: File | null) => void;
}

/** Escolha da imagem de capa: clicar ou arrastar; mostra a prévia com "Trocar" e "Remover". */
export function CampoImagem({ rotulo, arquivo, aoMudar }: Props) {
  const id = useId();
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  // URL temporária da prévia (liberada ao trocar/remover).
  useEffect(() => {
    if (!arquivo) {
      setPrevia(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  function escolher(novo: File | undefined) {
    if (!novo) return;
    const problema = validarImagem(novo);
    setErro(problema);
    if (!problema) aoMudar(novo);
  }

  function aoSelecionar(evento: ChangeEvent<HTMLInputElement>) {
    escolher(evento.target.files?.[0]);
    evento.target.value = ''; // permite escolher o mesmo arquivo de novo
  }

  function aoSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastando(false);
    escolher(evento.dataTransfer.files[0]);
  }

  function aoArrastar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastando(true);
  }

  const entrada = (
    <input
      id={id}
      type="file"
      accept={TIPOS_IMAGEM.join(',')}
      className={styles.arquivo}
      onChange={aoSelecionar}
      aria-describedby={erro ? `${id}-erro` : `${id}-dica`}
    />
  );

  return (
    <div className={styles.campo}>
      <span className={styles.rotulo}>{rotulo}</span>

      {previa ? (
        <div className={styles.previa}>
          <img src={previa} alt="Prévia da capa" className={styles.imagem} />
          <div className={styles.acoes}>
            <label htmlFor={id} className={styles.acao}>
              {entrada}
              <Icone nome="imagem" tamanho={16} />
              Trocar
            </label>
            <button type="button" className={styles.acao} onClick={() => aoMudar(null)}>
              <Icone nome="fechar" tamanho={16} />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={arrastando ? `${styles.area} ${styles.arrastando}` : styles.area}
          onDragOver={aoArrastar}
          onDragLeave={() => setArrastando(false)}
          onDrop={aoSoltar}
        >
          {entrada}
          <span className={styles.areaIcone}>
            <Icone nome="upload" />
          </span>
          <span className={styles.areaTitulo}>Adicionar imagem de capa</span>
          <span id={`${id}-dica`} className={styles.areaDica}>
            Clique ou arraste aqui · JPG, PNG ou WebP até 5 MB
          </span>
        </label>
      )}

      {erro && (
        <p id={`${id}-erro`} className={styles.erro} role="alert">
          <Icone nome="alerta" tamanho={14} />
          {erro}
        </p>
      )}
    </div>
  );
}
