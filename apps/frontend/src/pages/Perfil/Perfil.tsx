import { Botao } from '../../components/Botao';
import { Icone } from '../../components/Icone';
import { useAuth } from '../../contexts/useAuth';
import { iniciais } from '../../utils/cores';
import styles from './Perfil.module.css';

/** Provisória: a tela completa vem na issue #40. Já tem "Sair da conta" para testar a sessão (#21). */
export function Perfil() {
  const { usuario, sair } = useAuth();
  const nome = usuario?.nome ?? 'Você';

  return (
    <main className={styles.tela}>
      <section className={styles.cartao}>
        <span className={styles.avatar} aria-hidden="true">
          {iniciais(nome)}
        </span>
        <div className={styles.identidade}>
          <h1 className={styles.nome}>{nome}</h1>
          {usuario?.apelido && <p className={styles.apelido}>@{usuario.apelido}</p>}
          <p className={styles.cidade}>
            <Icone nome="local" tamanho={14} />
            Pouso Alegre, MG
          </p>
        </div>
      </section>

      <div className={styles.emBreve}>
        <span className={styles.emBreveIcone}>
          <Icone nome="brilho" />
        </span>
        <p>
          <strong>Perfil completo em breve.</strong> Interesses, privacidade e seus eventos chegam na issue #40.
        </p>
      </div>

      <Botao variante="secundario" icone="sair" onClick={sair} className={styles.sair}>
        Sair da conta
      </Botao>
    </main>
  );
}
