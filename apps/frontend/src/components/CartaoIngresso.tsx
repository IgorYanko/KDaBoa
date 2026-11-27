import { Link } from 'react-router';
import type { DataIso } from '../dtos';
import { dataLonga, hora } from '../utils/datas';
import styles from './CartaoIngresso.module.css';
import { Icone } from './Icone';

interface Props {
  codigo: string;
  titulo: string;
  dataInicio: DataIso;
  capaUrl?: string | null;
  localNome?: string | null;
  /** Quando informado, o cartão inteiro abre essa rota. */
  para?: string;
  indice?: number;
  total?: number;
}

function codigoLegivel(codigo: string): string {
  return codigo
    .replace(/\s/g, '')
    .toUpperCase()
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/** Ingresso visual: capa do evento, data, local e o código para mostrar na entrada. */
export function CartaoIngresso({ codigo, titulo, dataInicio, capaUrl, localNome, para, indice, total }: Props) {
  const varios = total !== undefined && total > 1 && indice !== undefined;
  const corpo = (
    <>
      <div className={styles.capa}>
        {capaUrl ? (
          <img className={styles.imagem} src={capaUrl} alt="" />
        ) : (
          <span className={styles.marca} aria-hidden="true">
            <Icone nome="ingresso" tamanho={120} traco={1.1} />
          </span>
        )}
        <span className={styles.faixa}>Ingresso</span>
      </div>
      <div className={styles.miolo}>
        {varios && (
          <p className={styles.ordem}>
            {indice} de {total}
          </p>
        )}
        <h2 className={styles.titulo}>{titulo}</h2>
        <ul className={styles.meta}>
          <li>
            <Icone nome="relogio" tamanho={15} />
            <span>
              {dataLonga(dataInicio)} · {hora(dataInicio)}
            </span>
          </li>
          {localNome && (
            <li>
              <Icone nome="local" tamanho={15} />
              <span>{localNome}</span>
            </li>
          )}
        </ul>
      </div>
      <div className={styles.picote} aria-hidden="true" />
      <div className={styles.codigoBloco}>
        <span className={styles.codigoRotulo}>Código</span>
        <p className={styles.codigo}>{codigoLegivel(codigo)}</p>
        <p className={styles.dica}>Mostre este código na entrada</p>
      </div>
    </>
  );

  if (para) {
    return (
      <Link to={para} className={styles.cartao}>
        {corpo}
      </Link>
    );
  }

  return <article className={styles.cartao}>{corpo}</article>;
}
