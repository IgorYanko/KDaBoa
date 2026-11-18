import styles from './Aviso.module.css';
import { Icone } from './Icone';

interface Props {
  tipo: 'erro' | 'sucesso';
  children: string;
}

/** Faixa de mensagem (erro vindo da API ou confirmação). Lida por leitores de tela. */
export function Aviso({ tipo, children }: Props) {
  return (
    <p role={tipo === 'erro' ? 'alert' : 'status'} className={`${styles.aviso} ${styles[tipo]}`}>
      <Icone nome={tipo === 'erro' ? 'alerta' : 'check'} tamanho={18} />
      <span>{children}</span>
    </p>
  );
}
