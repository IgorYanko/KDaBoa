import { TelaEmConstrucao } from '../../components/TelaEmConstrucao';
import { useAuth } from '../../contexts/useAuth';
import styles from './Perfil.module.css';

/** Provisória: a tela completa vem na issue #40. Já tem "Sair da conta" para testar a sessão (#21). */
export function Perfil() {
  const { usuario, sair } = useAuth();
  return (
    <>
      <TelaEmConstrucao titulo={usuario ? `Olá, ${usuario.nome}` : 'Perfil'} issue={40} />
      <div className={styles.acoes}>
        <button type="button" className={styles.sair} onClick={sair}>
          Sair da conta
        </button>
      </div>
    </>
  );
}
