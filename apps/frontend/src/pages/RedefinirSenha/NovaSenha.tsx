import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Botao, classesBotao } from '../../components/Botao';
import { BotaoIcone } from '../../components/BotaoIcone';
import { CampoSenha } from '../../components/CampoSenha';
import { redefinirSenha } from '../../services/auth';
import { SENHA_MAXIMA, SENHA_MINIMA } from '../Cadastro/validarCadastro';
import styles from './RedefinirSenha.module.css';

interface Props {
  /** Token que veio no link do e-mail. */
  token: string;
}

interface Erros {
  senha?: string;
  confirmacao?: string;
}

/** Passo 2: aberto pelo link do e-mail, grava a nova senha e volta para o login. */
export function NovaSenha({ token }: Props) {
  const navegar = useNavigate();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const [erro, setErro] = useState<string | null>(null);
  const [linkInvalido, setLinkInvalido] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const novosErros: Erros = {};
    if (senha.length < SENHA_MINIMA) novosErros.senha = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
    if (!confirmacao) novosErros.confirmacao = 'Repita a nova senha.';
    else if (confirmacao !== senha) novosErros.confirmacao = 'As senhas não são iguais.';
    setErros(novosErros);
    if (novosErros.senha || novosErros.confirmacao) return;

    setErro(null);
    setCarregando(true);
    try {
      await redefinirSenha({ token, senha });
      navegar('/login', { replace: true, state: { senhaRedefinida: true } });
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Algo deu errado. Tente de novo.');
      // 400 = token inválido, expirado ou já usado: só um link novo resolve.
      setLinkInvalido(e instanceof ErroApi && e.status === 400);
      setCarregando(false);
    }
  }

  return (
    <main className={styles.tela}>
      <BotaoIcone icone="voltar" rotulo="Voltar para o login" para="/login" className={styles.voltar} />

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Crie uma nova senha</h1>
        <p className={styles.subtitulo}>Use pelo menos {SENHA_MINIMA} caracteres. Depois é só entrar com ela.</p>
      </header>

      <form className={styles.formulario} onSubmit={aoEnviar} noValidate>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {linkInvalido && (
          <Link to="/redefinir-senha" className={classesBotao({ variante: 'secundario' })}>
            Pedir um novo link
          </Link>
        )}

        <CampoSenha
          rotulo="Nova senha"
          name="senha"
          autoComplete="new-password"
          placeholder={`Mín. ${SENHA_MINIMA} caracteres`}
          maxLength={SENHA_MAXIMA}
          value={senha}
          erro={erros.senha}
          onChange={(e) => {
            setSenha(e.target.value);
            setErros((atual) => ({ ...atual, senha: undefined }));
          }}
        />

        <CampoSenha
          rotulo="Confirme a nova senha"
          name="confirmacao"
          autoComplete="new-password"
          placeholder="Repita a senha"
          maxLength={SENHA_MAXIMA}
          value={confirmacao}
          erro={erros.confirmacao}
          onChange={(e) => {
            setConfirmacao(e.target.value);
            setErros((atual) => ({ ...atual, confirmacao: undefined }));
          }}
        />

        <Botao type="submit" carregando={carregando}>
          Salvar nova senha
        </Botao>
      </form>
    </main>
  );
}
