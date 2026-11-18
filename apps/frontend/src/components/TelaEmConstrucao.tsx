import { useLocation, useNavigate } from 'react-router';
import { BotaoIcone } from './BotaoIcone';
import { Icone } from './Icone';
import styles from './TelaEmConstrucao.module.css';

interface Props {
  titulo: string;
  /** Issue do GitHub que vai implementar a tela. */
  issue: number;
  /** Mostra o botão de voltar (padrão: sim; abas da navegação principal não precisam). */
  comVoltar?: boolean;
}

/** Tela provisória para as rotas que ainda não foram implementadas. */
export function TelaEmConstrucao({ titulo, issue, comVoltar = true }: Props) {
  const navegar = useNavigate();
  const local = useLocation();

  function voltar() {
    // Link aberto direto: não há tela anterior no app.
    if (local.key === 'default') navegar('/inicio');
    else navegar(-1);
  }

  return (
    <main className={styles.tela}>
      {comVoltar && <BotaoIcone icone="voltar" rotulo="Voltar" onClick={voltar} className={styles.voltar} />}
      <span className={styles.icone}>
        <Icone nome="brilho" tamanho={24} />
      </span>
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.texto}>Essa tela está sendo preparada e chega em breve (issue #{issue}).</p>
    </main>
  );
}
