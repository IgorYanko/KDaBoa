import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ErroApi } from '../../api/client';
import iconeVoltar from '../../assets/icones/voltar.svg';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Campo } from '../../components/Campo';
import { Chip } from '../../components/Chip';
import { Interruptor } from '../../components/Interruptor';
import { Segmentos } from '../../components/Segmentos';
import type { CadastroRequestDTO, CategoriaDTO } from '../../dtos';
import { cadastrar } from '../../services/auth';
import { listarCategorias } from '../../services/categorias';
import { formatarCnpj } from '../../utils/cnpj';
import styles from './Cadastro.module.css';
import { type ErrosCadastro, nascimentoMaximo, SENHA_MAXIMA, validarCadastro } from './validarCadastro';

const INICIAL: CadastroRequestDTO = {
  tipo: 'pessoa',
  nome: '',
  email: '',
  senha: '',
  data_nascimento: '',
  cnpj: '',
  nome_fantasia: '',
  interesses: [],
  // Privado por padrão: a pessoa escolhe se quer aparecer em "Quem vai".
  mostrar_presenca: false,
};

/** Tela 2 · Cadastro (issue #16). */
export function Cadastro() {
  const navegar = useNavigate();
  const [dados, setDados] = useState<CadastroRequestDTO>(INICIAL);
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(() => setErroApi('Não foi possível carregar os interesses.'));
  }, []);

  function alterar<K extends keyof CadastroRequestDTO>(campo: K, valor: CadastroRequestDTO[K]) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function alternarInteresse(id: number) {
    // Calcula a partir do estado mais recente: toques seguidos antes do próximo render não se perdem.
    setDados((atual) => ({
      ...atual,
      interesses: atual.interesses.includes(id)
        ? atual.interesses.filter((i) => i !== id)
        : [...atual.interesses, id],
    }));
    setErros((atual) => ({ ...atual, interesses: undefined }));
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroApi(null);
    const encontrados = validarCadastro(dados);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setCarregando(true);
    try {
      const resposta = await cadastrar({
        ...dados,
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        nome_fantasia: dados.nome_fantasia?.trim(),
        cnpj: dados.cnpj?.replace(/\D/g, ''),
      });
      navegar('/login', { replace: true, state: { emailCadastrado: resposta.usuario.email } });
    } catch (e) {
      setErroApi(e instanceof ErroApi ? e.message : 'Algo deu errado. Tente de novo.');
      setCarregando(false);
    }
  }

  return (
    <main className={styles.tela}>
      <Link to="/login" className={styles.voltar} aria-label="Voltar para o login">
        <img src={iconeVoltar} alt="" width={20} height={20} />
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Crie sua conta</h1>
        <p className={styles.subtitulo}>
          {dados.tipo === 'cnpj' ? 'Conta de empresa para eventos verificados.' : 'Leva menos de um minuto.'}
        </p>
      </header>

      <form id="form-cadastro" className={styles.formulario} onSubmit={aoEnviar} noValidate>
        {erroApi && <Aviso tipo="erro">{erroApi}</Aviso>}

        <Segmentos
          rotulo="Tipo de conta"
          opcoes={[
            { valor: 'pessoa', rotulo: 'Pessoa' },
            { valor: 'cnpj', rotulo: 'Empresa' },
          ]}
          selecionado={dados.tipo ?? 'pessoa'}
          onMudar={(valor) => {
            if (valor) alterar('tipo', valor);
          }}
        />

        <Campo
          rotulo={dados.tipo === 'cnpj' ? 'Razão social' : 'Nome'}
          name="nome"
          autoComplete="organization"
          placeholder={dados.tipo === 'cnpj' ? 'Nome da empresa' : 'Como você quer ser chamado'}
          compacto
          value={dados.nome}
          erro={erros.nome}
          onChange={(e) => alterar('nome', e.target.value)}
        />
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          compacto
          value={dados.email}
          erro={erros.email}
          onChange={(e) => alterar('email', e.target.value)}
        />

        {dados.tipo === 'cnpj' ? (
          <>
            <Campo
              rotulo="Nome fantasia"
              name="nome_fantasia"
              placeholder="Como o público conhece a empresa"
              compacto
              value={dados.nome_fantasia ?? ''}
              onChange={(e) => alterar('nome_fantasia', e.target.value)}
            />
            <Campo
              rotulo="CNPJ"
              name="cnpj"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              compacto
              value={formatarCnpj(dados.cnpj ?? '')}
              erro={erros.cnpj}
              onChange={(e) => alterar('cnpj', e.target.value.replace(/\D/g, '').slice(0, 14))}
            />
            <Campo
              rotulo="Senha"
              type="password"
              name="senha"
              autoComplete="new-password"
              placeholder="Mín. 8 caracteres"
              compacto
              maxLength={SENHA_MAXIMA}
              value={dados.senha}
              erro={erros.senha}
              onChange={(e) => alterar('senha', e.target.value)}
            />
          </>
        ) : (
          <div className={styles.duasColunas}>
            <Campo
              rotulo="Nascimento"
              type="date"
              name="data_nascimento"
              autoComplete="bday"
              compacto
              max={nascimentoMaximo()}
              value={dados.data_nascimento}
              erro={erros.data_nascimento}
              onChange={(e) => alterar('data_nascimento', e.target.value)}
            />
            <Campo
              rotulo="Senha"
              type="password"
              name="senha"
              autoComplete="new-password"
              placeholder="Mín. 8 caracteres"
              compacto
              maxLength={SENHA_MAXIMA}
              value={dados.senha}
              erro={erros.senha}
              onChange={(e) => alterar('senha', e.target.value)}
            />
          </div>
        )}

        {dados.tipo !== 'cnpj' && (
        <fieldset className={styles.interesses} aria-describedby={erros.interesses ? 'erro-interesses' : undefined}>
          <legend className={styles.legenda}>O que você curte?</legend>
          <div className={styles.chips}>
            {categorias.map((categoria) => (
              <Chip
                key={categoria.id}
                rotulo={categoria.nome}
                selecionado={dados.interesses.includes(categoria.id)}
                onAlternar={() => alternarInteresse(categoria.id)}
              />
            ))}
          </div>
          {erros.interesses && (
            <p id="erro-interesses" className={styles.erro}>
              {erros.interesses}
            </p>
          )}
        </fieldset>
        )}

        {dados.tipo !== 'cnpj' && (
        <div className={styles.presenca}>
          <Interruptor
            titulo="Mostrar minha presença"
            descricao="Outras pessoas veem quando você confirma um evento."
            ligado={dados.mostrar_presenca}
            onAlternar={(ligado) => alterar('mostrar_presenca', ligado)}
          />
        </div>
        )}
      </form>

      <div className={styles.acoes}>
        <Botao type="submit" form="form-cadastro" carregando={carregando}>
          Criar conta
        </Botao>
        <p className={styles.rodape}>
          Já tem conta?{' '}
          <Link to="/login" className={styles.destaque}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
