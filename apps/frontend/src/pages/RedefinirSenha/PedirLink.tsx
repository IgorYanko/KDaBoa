import { type FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Botao, classesBotao } from '../../components/Botao';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Campo } from '../../components/Campo';
import { Icone } from '../../components/Icone';
import { pedirRedefinicaoSenha } from '../../services/auth';
import styles from './RedefinirSenha.module.css';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Enviado {
  email: string;
  /** Só no modo mock: o link que iria no e-mail. */
  linkTeste?: string;
}

/** Passo 1: a pessoa informa o e-mail e recebe o link para criar uma nova senha. */
export function PedirLink() {
  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState<string>();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState<Enviado | null>(null);
  const [reenviado, setReenviado] = useState(false);

  async function enviar(destino: string): Promise<boolean> {
    setErro(null);
    setCarregando(true);
    try {
      const resposta = await pedirRedefinicaoSenha({ email: destino });
      setEnviado({ email: destino, linkTeste: resposta.link_teste });
      return true;
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Algo deu errado. Tente de novo.');
      return false;
    } finally {
      setCarregando(false);
    }
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const destino = email.trim();
    if (!destino) return setErroEmail('Informe seu e-mail.');
    if (!EMAIL_VALIDO.test(destino)) return setErroEmail('E-mail inválido.');
    setErroEmail(undefined);
    await enviar(destino);
  }

  async function reenviar() {
    if (!enviado) return;
    setReenviado(false);
    setReenviado(await enviar(enviado.email));
  }

  function usarOutroEmail() {
    setEnviado(null);
    setReenviado(false);
    setErro(null);
  }

  if (enviado) {
    const { linkTeste } = enviado;
    return (
      <main className={styles.tela}>
        <BotaoIcone icone="voltar" rotulo="Voltar para o login" para="/login" className={styles.voltar} />

        <header className={styles.cabecalho}>
          <span className={styles.selo} aria-hidden="true">
            <Icone nome="enviar" tamanho={22} />
          </span>
          <h1 className={styles.titulo}>Confira seu e-mail</h1>
          <p className={styles.subtitulo}>
            Se <strong className={styles.email}>{enviado.email}</strong> tiver uma conta, enviamos um link para criar
            uma nova senha. Ele vale por 1 hora e só pode ser usado uma vez.
          </p>
        </header>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {reenviado && !erro && <Aviso tipo="sucesso">Enviamos um novo link. O anterior deixou de valer.</Aviso>}

        {linkTeste && (
          <div className={styles.teste}>
            <p>
              <strong>Modo de teste:</strong> o e-mail não é enviado de verdade.
            </p>
            <Link to={linkTeste} className={styles.linkTeste}>
              Abrir o link do e-mail
              <Icone nome="seta-direita" tamanho={16} />
            </Link>
          </div>
        )}

        <div className={styles.acoes}>
          <Link to="/login" className={classesBotao()}>
            Voltar para o login
          </Link>
          <Botao variante="secundario" carregando={carregando} onClick={reenviar}>
            Enviar de novo
          </Botao>
          <button type="button" className={styles.textoAcao} onClick={usarOutroEmail}>
            Usar outro e-mail
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.tela}>
      <BotaoIcone icone="voltar" rotulo="Voltar para o login" para="/login" className={styles.voltar} />

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Esqueceu a senha?</h1>
        <p className={styles.subtitulo}>
          Sem problema. Informe o e-mail da sua conta e enviamos um link para você criar uma nova.
        </p>
      </header>

      <form className={styles.formulario} onSubmit={aoEnviar} noValidate>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          value={email}
          erro={erroEmail}
          onChange={(e) => {
            setEmail(e.target.value);
            setErroEmail(undefined);
          }}
        />

        <Botao type="submit" carregando={carregando}>
          Enviar link
        </Botao>
      </form>

      <p className={styles.rodape}>
        Lembrou a senha?{' '}
        <Link to="/login" className={styles.destaque}>
          Entrar
        </Link>
      </p>
    </main>
  );
}
