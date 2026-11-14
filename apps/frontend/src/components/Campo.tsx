import { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import styles from './Campo.module.css';
import { CampoDataHora } from './CampoDataHora';
import { Icone, type NomeIcone } from './Icone';

export interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  /** Mensagem de erro do campo (aparece embaixo e marca o input). */
  erro?: string;
  /** Algo dentro do input, à direita (ex.: botão de mostrar senha). */
  acessorio?: ReactNode;
  /** Ícone dentro do input, à esquerda. */
  icone?: NomeIcone;
  /** Altura menor (44px), usada no cadastro. */
  compacto?: boolean;
}

/**
 * Rótulo + input. Data e horário (type="date" / "time") usam o CampoDataHora, que mostra
 * sempre dd/mm/aaaa e 24h, qualquer que seja o idioma do navegador.
 */
export function Campo(todas: CampoProps) {
  const idGerado = useId();
  const tipo = todas.type;
  if (tipo === 'date' || tipo === 'time') return <CampoDataHora {...todas} type={tipo as 'date' | 'time'} />;

  const { rotulo, erro, acessorio, icone, compacto, id, className, ...props } = todas;
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;

  const classesInput = [
    styles.input,
    compacto && styles.compacto,
    icone && styles.comIcone,
    acessorio && styles.comAcessorio,
    erro && styles.invalido,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className ? `${styles.campo} ${className}` : styles.campo}>
      <label htmlFor={idCampo} className={styles.rotulo}>
        {rotulo}
      </label>
      <div className={styles.caixa}>
        {icone && (
          <span className={styles.icone}>
            <Icone nome={icone} tamanho={18} />
          </span>
        )}
        <input
          id={idCampo}
          className={classesInput}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          {...props}
        />
        {acessorio && <div className={styles.acessorio}>{acessorio}</div>}
      </div>
      {erro && (
        <p id={idErro} className={styles.erro}>
          <Icone nome="alerta" tamanho={14} />
          {erro}
        </p>
      )}
    </div>
  );
}
