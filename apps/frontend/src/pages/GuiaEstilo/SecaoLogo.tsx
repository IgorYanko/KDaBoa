import { Logo, LOGO_ESCOLHIDA, type VarianteLogo } from '../../components/Logo';
import { Marca } from '../../components/Marca';
import styles from './GuiaEstilo.module.css';

const propostas: { variante: VarianteLogo; nome: string; ideia: string }[] = [
  { variante: 'pin', nome: 'Pin-brilho', ideia: 'Pin de localização com um brilho dentro: "cadê a boa?".' },
  { variante: 'balao', nome: 'Balão', ideia: 'Balão de conversa com o "?" do nome: a pergunta e o chat da galera.' },
  { variante: 'sinal', nome: 'Sinal', ideia: 'Pin emitindo ondas: o que está rolando agora, perto de você.' },
];

/** As três propostas de logo lado a lado, com os usos no app. */
export function SecaoLogo() {
  return (
    <section className={styles.secao}>
      <h2 className={styles.secaoTitulo}>Logo — propostas</h2>
      <p className={styles.texto}>
        Em uso no app: <strong>{propostas.find((p) => p.variante === LOGO_ESCOLHIDA)?.nome}</strong>. Para trocar, mude{' '}
        <code>LOGO_ESCOLHIDA</code> em <code>components/Logo.tsx</code>.
      </p>
      <ul className={styles.logos}>
        {propostas.map((proposta) => (
          <li
            key={proposta.variante}
            className={proposta.variante === LOGO_ESCOLHIDA ? `${styles.logo} ${styles.logoEscolhida}` : styles.logo}
          >
            <div className={styles.logoPalco}>
              <span className={styles.logoGrande}>
                <Logo tamanho={96} variante={proposta.variante} />
              </span>
            </div>
            <div className={styles.logoUsos}>
              <Marca tamanho="md" variante={proposta.variante} />
              <span className={styles.logoFavicon}>
                <Logo tamanho={20} variante={proposta.variante} />
              </span>
              <span className={styles.logoEnviar} title="Botão de enviar do chat">
                <Logo
                  tamanho={22}
                  variante={proposta.variante}
                  className={proposta.variante === 'pin' ? styles.logoGirada : undefined}
                />
              </span>
            </div>
            <p className={styles.corNome}>{proposta.nome}</p>
            <p className={styles.corUso}>{proposta.ideia}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
