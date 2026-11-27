import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Icone } from '../../components/Icone';
import { Interruptor } from '../../components/Interruptor';
import { useAuth } from '../../contexts/useAuth';
import type { AtualizarPerfilRequestDTO, CategoriaDTO, ContadoresPerfilDTO, UsuarioDTO } from '../../dtos';
import { listarCategorias } from '../../services/categorias';
import { atualizarPerfil, buscarContadores, buscarPerfil } from '../../services/perfil';
import { iniciais } from '../../utils/cores';
import { InteressesPerfil } from './InteressesPerfil';
import styles from './Perfil.module.css';

function mensagemDe(e: unknown, padrao: string): string {
  return e instanceof ErroApi ? e.message : padrao;
}

/** Tela 7 · Perfil (issue #40): interesses, privacidade da presença, lembretes e saída da conta. */
export function Perfil() {
  const { usuario, sair } = useAuth();
  const [perfil, setPerfil] = useState<UsuarioDTO | null>(null);
  const [contadores, setContadores] = useState<ContadoresPerfilDTO | null>(null);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAviso, setErroAviso] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarPerfil()
      .then((dados) => {
        if (ativo) setPerfil(dados);
      })
      .catch((e) => {
        if (ativo) setErro(mensagemDe(e, 'Não foi possível carregar o perfil.'));
      });
    // Números e categorias são complementos: se falharem, a tela segue sem eles.
    buscarContadores()
      .then((dados) => {
        if (ativo) setContadores(dados);
      })
      .catch(() => {});
    listarCategorias()
      .then((lista) => {
        if (ativo) setCategorias(lista);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  /** Interruptores: mudam na hora e voltam atrás se a API recusar. */
  async function alternar(campo: 'mostrar_presenca' | 'receber_lembretes', ligado: boolean) {
    if (!perfil) return;
    const anterior = perfil;
    setErroAviso(null);
    setPerfil({ ...perfil, [campo]: ligado });
    try {
      setPerfil(await atualizarPerfil({ [campo]: ligado } as AtualizarPerfilRequestDTO));
    } catch (e) {
      setPerfil(anterior);
      setErroAviso(mensagemDe(e, 'Não foi possível salvar. Tente de novo.'));
    }
  }

  async function salvarInteresses(interesses: number[]) {
    try {
      setPerfil(await atualizarPerfil({ interesses }));
    } catch (e) {
      throw new Error(mensagemDe(e, 'Não foi possível salvar os interesses.'));
    }
  }

  const nome = perfil?.nome ?? usuario?.nome ?? 'Você';
  const apelido = perfil?.apelido ?? usuario?.apelido;
  const numeros: { rotulo: string; valor?: number; para?: string }[] = [
    { rotulo: 'Próximos', valor: contadores?.proximos, para: '/agenda' },
    { rotulo: 'Seguindo', valor: contadores?.seguindo },
    { rotulo: 'Seguidores', valor: contadores?.seguidores },
  ];

  return (
    <main className={styles.tela}>
      <header className={styles.identificacao}>
        <span className={styles.avatar} aria-hidden="true">
          {iniciais(nome)}
        </span>
        <div className={styles.identidade}>
          <h1 className={styles.nome}>{nome}</h1>
          <p className={styles.apelido}>
            {apelido && `@${apelido} · `}
            Pouso Alegre
          </p>
        </div>
      </header>

      <ul className={styles.numeros} aria-label="Seus números">
        {numeros.map(({ rotulo, valor, para }) => {
          const conteudo = (
            <>
              <span className={styles.numeroValor}>{valor ?? '–'}</span>
              <span className={styles.numeroRotulo}>{rotulo}</span>
            </>
          );
          return (
            <li key={rotulo}>
              {para ? (
                <Link to={para} className={`${styles.numero} ${styles.numeroLink}`}>
                  {conteudo}
                </Link>
              ) : (
                <span className={styles.numero}>{conteudo}</span>
              )}
            </li>
          );
        })}
      </ul>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {perfil ? (
        <>
          <InteressesPerfil
            key={(perfil.interesses ?? []).join(',')}
            categorias={categorias}
            selecionados={perfil.interesses ?? []}
            onSalvar={salvarInteresses}
          />

          <section className={styles.secao} aria-labelledby="titulo-privacidade">
            <h2 id="titulo-privacidade" className={styles.secaoTitulo}>
              Privacidade e avisos
            </h2>
            {erroAviso && <Aviso tipo="erro">{erroAviso}</Aviso>}
            <div className={styles.interruptores}>
              <Interruptor
                titulo="Presença visível"
                descricao='Aparecer na lista "Quem vai" dos eventos'
                ligado={perfil.mostrar_presenca ?? false}
                onAlternar={(ligado) => alternar('mostrar_presenca', ligado)}
              />
              <Interruptor
                titulo="Lembretes de eventos"
                descricao="E-mail no dia dos eventos confirmados"
                ligado={perfil.receber_lembretes ?? false}
                onAlternar={(ligado) => alternar('receber_lembretes', ligado)}
              />
            </div>
          </section>
        </>
      ) : (
        !erro && (
          <div className={styles.esqueleto} role="status">
            <span className={styles.somenteLeitor}>Carregando perfil…</span>
          </div>
        )
      )}

      <nav className={styles.acoes} aria-label="Ações da conta">
        <Link to="/divulgar" className={styles.acao}>
          <Icone nome="mais" tamanho={20} className={styles.acaoIcone} />
          <span className={styles.acaoTexto}>Divulgar um evento</span>
          <Icone nome="seta-direita" tamanho={18} className={styles.acaoSeta} />
        </Link>
        <button type="button" className={`${styles.acao} ${styles.sair}`} onClick={sair}>
          <Icone nome="sair" tamanho={20} className={styles.acaoIcone} />
          <span className={styles.acaoTexto}>Sair da conta</span>
        </button>
      </nav>
    </main>
  );
}
