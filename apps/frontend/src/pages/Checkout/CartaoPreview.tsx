import { bandeiraDoBin, cvvExibido, nomeDaBandeira, numeroMascarado, validadeExibida, type Bandeira } from './bandeiraCartao';
import styles from './CartaoPreview.module.css';

interface CartaoPreviewProps {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  verso: boolean;
}

/** Cartão desenhado ao lado do formulário. O pagamento segue com o token do Mercado Pago. */
export function CartaoPreview({ numero, nome, validade, cvv, verso }: CartaoPreviewProps) {
  const bandeira = bandeiraDoBin(numero);
  const titular = nome.trim() ? nome.trim().toUpperCase() : 'NOME DO TITULAR';
  const validadePreenchida = validade.replace(/\D/g, '').length > 0;

  return (
    <div className={styles.cena} aria-hidden="true">
      <div className={`${styles.cartao} ${verso ? styles.virado : ''} ${styles[bandeira]}`}>
        <div className={styles.frente}>
          <div className={styles.topo}>
            <span className={styles.chip} />
            <Marca bandeira={bandeira} />
          </div>
          <p className={styles.numero}>{numeroMascarado(numero, bandeira)}</p>
          <div className={styles.rodape}>
            <p className={styles.bloco}>
              <span className={styles.legenda}>Titular</span>
              <span className={styles.valor}>{titular}</span>
            </p>
            <p className={styles.bloco}>
              <span className={styles.legenda}>Validade</span>
              <span className={`${styles.valor} ${validadePreenchida ? '' : styles.vazio}`}>{validadeExibida(validade)}</span>
            </p>
          </div>
        </div>
        <div className={styles.verso}>
          <span className={styles.tarja} />
          <p className={styles.cvv}>
            <span className={styles.legenda}>CVV</span>
            <span className={styles.caixaCvv}>{cvvExibido(cvv, bandeira)}</span>
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
      <span className={styles.marcaMaster}>
        <span />
        <span />
      </span>
    );
  }
  return <span className={styles.nomeBandeira}>{nomeDaBandeira(bandeira)}</span>;
}
