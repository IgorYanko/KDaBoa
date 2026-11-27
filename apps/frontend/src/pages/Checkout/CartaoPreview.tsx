import { bandeiraDoBin, nomeDaBandeira, numeroMascarado, type Bandeira } from './bandeiraCartao';
import styles from './CartaoPreview.module.css';

interface CartaoPreviewProps {
  bin: string;
  nome: string;
  verso: boolean;
}

/** Cartão desenhado ao lado do formulário. O número completo fica no campo seguro do Mercado Pago. */
export function CartaoPreview({ bin, nome, verso }: CartaoPreviewProps) {
  const bandeira = bandeiraDoBin(bin);
  const titular = nome.trim() ? nome.trim().toUpperCase() : 'NOME DO TITULAR';

  return (
    <div className={styles.cena} aria-hidden="true">
      <div className={`${styles.cartao} ${verso ? styles.virado : ''} ${styles[bandeira]}`}>
        <div className={styles.frente}>
          <div className={styles.topo}>
            <span className={styles.chip} />
            <Marca bandeira={bandeira} />
          </div>
          <p className={styles.numero}>{numeroMascarado(bin, bandeira)}</p>
          <div className={styles.rodape}>
            <p className={styles.bloco}>
              <span className={styles.legenda}>Titular</span>
              <span className={styles.valor}>{titular}</span>
            </p>
            <p className={styles.bloco}>
              <span className={styles.legenda}>Validade</span>
              <span className={styles.valor}>MM/AA</span>
            </p>
          </div>
        </div>
        <div className={styles.verso}>
          <span className={styles.tarja} />
          <p className={styles.cvv}>
            <span className={styles.legenda}>CVV</span>
            <span className={styles.caixaCvv}>•••</span>
          </p>
        </div>
      </div>
      <p className={styles.bandeira}>{nomeDaBandeira(bandeira)}</p>
    </div>
  );
}

function Marca({ bandeira }: { bandeira: Bandeira }) {
  if (bandeira === 'master') {
    return (
      <span className={styles.master}>
        <span />
        <span />
      </span>
    );
  }
  return <span className={styles.nomeBandeira}>{nomeDaBandeira(bandeira)}</span>;
}
