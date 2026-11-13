import styles from './Aviso.module.css';

interface Props {
  tipo: 'erro' | 'sucesso';
  children: string;
}

/** Faixa de mensagem (erro vindo da API ou confirmação). Lida por leitores de tela. */
export function Aviso({ tipo, children }: Props) {
  return (
    <p role={tipo === 'erro' ? 'alert' : 'status'} className={`${styles.aviso} ${styles[tipo]}`}>
      {children}
    </p>
  );
}
