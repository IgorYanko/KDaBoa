import { Component, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { classesBotao } from './Botao';
import { Icone } from './Icone';
import styles from './LimiteErro.module.css';

interface Props {
  children: ReactNode;
}

interface Estado {
  erro: boolean;
}

/**
 * Se alguma tela quebrar, mostra uma mensagem amigável em vez da tela branca.
 * Exceção à regra de componentes em função: o React só captura erros de renderização
 * com componente de classe (getDerivedStateFromError).
 */
class LimiteErroDaTela extends Component<Props, Estado> {
  state: Estado = { erro: false };

  static getDerivedStateFromError(): Estado {
    return { erro: true };
  }

  componentDidCatch(erro: unknown) {
    // Fica no console para quem estiver depurando; a pessoa não vê detalhes técnicos.
    console.error(erro);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <main className={styles.tela}>
        <div className={styles.cartao}>
          <span className={styles.icone} aria-hidden="true">
            <Icone nome="alerta" tamanho={26} />
          </span>
          <h1 className={styles.titulo}>Algo saiu do roteiro</h1>
          <p className={styles.texto}>Essa tela teve um problema. Seus dados estão salvos; tente de novo.</p>
          <div className={styles.botoes}>
            <button type="button" className={classesBotao()} onClick={() => window.location.reload()}>
              Recarregar a página
            </button>
            <a href="/inicio" className={classesBotao({ variante: 'secundario' })}>
              Voltar ao início
            </a>
          </div>
        </div>
      </main>
    );
  }
}

/**
 * O limite recomeça a cada tela (pela rota): se uma tela quebrar, voltar ou abrir outra
 * mostra a nova normalmente, sem precisar recarregar a página.
 */
export function LimiteErro({ children }: Props) {
  const { pathname } = useLocation();
  return <LimiteErroDaTela key={pathname}>{children}</LimiteErroDaTela>;
}
