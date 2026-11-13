import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ErroApi } from '../../api/client';
import iconePin from '../../assets/icones/pin.svg';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Campo } from '../../components/Campo';
import { CampoSenha } from '../../components/CampoSenha';
import { useAuth } from '../../contexts/useAuth';
import { SENHA_MAXIMA } from '../Cadastro/validarCadastro';
import styles from './Login.module.css';

/** Estado enviado pelo cadastro ao voltar para cá. */
interface EstadoLogin {
  emailCadastrado?: string;
}

/** Tela 1 · Login (issue #14). */
export function Login() {
  const { entrar } = useAuth();
  const estado = (useLocation().state ?? {}) as EstadoLogin;

  const [email, setEmail] = useState(estado.emailCadastrado ?? '');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.');
      return;
    }
    setCarregando(true);
    try {
      // Com sucesso, a RotaPublica leva para o Início (ou para a tela que o usuário tentou abrir).
      await entrar({ email: email.trim(), senha });
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Algo deu errado. Tente de novo.');
      setCarregando(false);
    }
  }

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <div className={styles.logo}>
          <img src={iconePin} alt="" width={28} height={28} />
        </div>
        <h1 className={styles.titulo}>KdABoa?</h1>
        <p className={styles.subtitulo}>Descubra o que está rolando em Pouso Alegre e veja quem vai.</p>
      </header>

      <form className={styles.formulario} onSubmit={aoEnviar} noValidate>
        {estado.emailCadastrado && !erro && <Aviso tipo="sucesso">Conta criada! Agora é só entrar.</Aviso>}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className={styles.grupoSenha}>
          <CampoSenha
            rotulo="Senha"
            name="senha"
            autoComplete="current-password"
            placeholder="Sua senha"
            maxLength={SENHA_MAXIMA}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Link to="/redefinir-senha" className={styles.esqueci}>
            Esqueci minha senha
          </Link>
        </div>

        <Botao type="submit" carregando={carregando} className={styles.entrar}>
          Entrar
        </Botao>
      </form>

      <p className={styles.rodape}>
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className={styles.destaque}>
          Criar conta
        </Link>
      </p>
    </main>
  );
}
