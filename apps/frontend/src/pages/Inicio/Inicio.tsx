import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { BoasVindas } from '../../components/BoasVindas';
import { BotaoIcone } from '../../components/BotaoIcone';
import { CampoBusca } from '../../components/CampoBusca';
import { Chip } from '../../components/Chip';
import { EventoCard } from '../../components/EventoCard';
import { Icone } from '../../components/Icone';
import { Segmentos } from '../../components/Segmentos';
import { useAuth } from '../../contexts/useAuth';
import type { CategoriaDTO, FiltroEventosDTO } from '../../dtos';
import { listarCategorias } from '../../services/categorias';
import { Botao } from '../../components/Botao';
import { type EventoCompleto, listarEventosPaginados } from '../../services/eventos';
import styles from './Inicio.module.css';

type Periodo = NonNullable<FiltroEventosDTO['periodo']>;

/** Eventos por página (múltiplo de 3, para fechar as linhas da grade no desktop). */
const POR_PAGINA = 9;

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'fim-de-semana', rotulo: 'Fim de semana' },
  { valor: 'este-mes', rotulo: 'Este mês' },
];

/** Tela 3 · Início (issue #22). */
export function Inicio() {
  const { usuario } = useAuth();
  const primeiroNome = usuario?.nome.split(' ')[0];
  // Vindo do detalhe depois de excluir um evento. O aviso fica na tela, mas sai do histórico
  // do navegador, para não voltar a aparecer ao recarregar ou ao voltar para o Início.
  const local = useLocation();
  const navegar = useNavigate();
  const [excluido] = useState(() => (local.state as { excluido?: string } | null)?.excluido);
  useEffect(() => {
    if ((local.state as { excluido?: string } | null)?.excluido) {
      navegar(local.pathname, { replace: true, state: null });
    }
  }, [local.state, local.pathname, navegar]);

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [eventos, setEventos] = useState<EventoCompleto[] | null>(null);
  const [totalEventos, setTotalEventos] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** Buscando de novo após mudar um filtro (a lista anterior fica apagada até chegar a nova). */
  const [atualizando, setAtualizando] = useState(false);

  // Espera a pessoa parar de digitar antes de buscar.
  useEffect(() => {
    const espera = setTimeout(() => setBuscaAplicada(busca), 250);
    return () => clearTimeout(espera);
  }, [busca]);

  const filtro = useMemo<FiltroEventosDTO>(
    () => ({
      busca: buscaAplicada || undefined,
      periodo: periodo ?? undefined,
      categoria_id: categoriaId ?? undefined,
    }),
    [buscaAplicada, periodo, categoriaId],
  );

  // Categorias para o filtro (se falhar, a tela segue sem a fileira).
  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  /** Muda a cada filtro novo: um "Carregar mais" que volte depois disso é descartado. */
  const versaoFiltro = useRef(0);

  useEffect(() => {
    let ativo = true;
    versaoFiltro.current += 1;
    setErro(null);
    setAtualizando(true);
    // Filtro novo: recomeça da primeira página.
    listarEventosPaginados(filtro, 1, POR_PAGINA)
      .then((resultado) => {
        if (!ativo) return;
        setEventos(resultado.itens);
        setTotalEventos(resultado.total);
        setTemMais(resultado.temMais);
        setPagina(1);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar os eventos.');
      })
      .finally(() => {
        if (ativo) setAtualizando(false);
      });
    return () => {
      ativo = false;
    };
  }, [filtro]);

  async function carregarMais() {
    const versao = versaoFiltro.current;
    setCarregandoMais(true);
    try {
      const resultado = await listarEventosPaginados(filtro, pagina + 1, POR_PAGINA);
      // O filtro mudou enquanto esta página chegava: ela é de outra lista.
      if (versao !== versaoFiltro.current) return;
      setEventos((atual) => {
        const ids = new Set(atual?.map((item) => item.evento.id));
        return [...(atual ?? []), ...resultado.itens.filter((item) => !ids.has(item.evento.id))];
      });
      setTotalEventos(resultado.total);
      setTemMais(resultado.temMais);
      setPagina((atual) => atual + 1);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar mais eventos.');
    } finally {
      setCarregandoMais(false);
    }
  }

  const total = totalEventos;
  const mostrando = eventos?.length ?? 0;
  const temFiltro = Boolean(buscaAplicada || periodo || categoriaId);

  function limparFiltros() {
    setBusca('');
    setBuscaAplicada('');
    setPeriodo(null);
    setCategoriaId(null);
  }

  return (
    <main className={styles.tela}>
      <BoasVindas />
      {excluido && <Aviso tipo="sucesso">{`Evento "${excluido}" excluído.`}</Aviso>}

      <header className={styles.cabecalho}>
        <div className={styles.saudacao}>
          <p className={styles.cidade}>
            <Icone nome="local" tamanho={14} />
            Pouso Alegre, MG
          </p>
          <h1 className={styles.titulo}>
            {primeiroNome ? (
              <>
                Bora sair, <span className={styles.nome}>{primeiroNome}</span>?
              </>
            ) : (
              'Bora sair?'
            )}
          </h1>
        </div>
        {/* No desktop o "Divulgar evento" fica na barra do topo. */}
        <BotaoIcone icone="mais" rotulo="Divulgar um evento" para="/divulgar" className={styles.divulgar} />
      </header>

      <div className={styles.filtros}>
        <CampoBusca
          rotulo="Buscar eventos"
          placeholder="Buscar shows, festas, lugares…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className={styles.busca}
        />
        <div className={styles.periodo}>
          <Segmentos rotulo="Quando" opcoes={PERIODOS} selecionado={periodo} onMudar={setPeriodo} />
        </div>
      </div>

      {categorias.length > 0 && (
        <fieldset className={styles.categorias}>
          <legend className={styles.somenteLeitor}>Categoria</legend>
          <div className={styles.categoriasLista}>
            {categorias.map((categoria) => (
              <Chip
                key={categoria.id}
                rotulo={categoria.nome}
                selecionado={categoriaId === categoria.id}
                onAlternar={() => setCategoriaId((atual) => (atual === categoria.id ? null : categoria.id))}
              />
            ))}
          </div>
        </fieldset>
      )}

      <section className={styles.secao} aria-labelledby="titulo-proximos">
        <div className={styles.secaoCabecalho}>
          <h2 id="titulo-proximos" className={styles.secaoTitulo}>
            Próximos eventos
          </h2>
          {eventos && (
            <span className={styles.contagem} aria-live="polite">
              {total} {total === 1 ? 'evento' : 'eventos'}
            </span>
          )}
        </div>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        {!eventos && !erro && (
          <ul className={styles.lista} aria-label="Carregando eventos">
            {[1, 2, 3].map((n) => (
              <li key={n} className={styles.esqueleto} aria-hidden="true" />
            ))}
          </ul>
        )}

        {eventos && total === 0 && (
          <div className={styles.vazio}>
            <span className={styles.vazioIcone}>
              <Icone nome="busca" tamanho={22} />
            </span>
            <p className={styles.vazioTitulo}>Nenhum evento encontrado</p>
            <p className={styles.vazioTexto}>
              {temFiltro ? 'Tente outra busca, outro período ou outra categoria.' : 'Ainda não tem eventos por aqui.'}
            </p>
            {temFiltro && (
              <button type="button" className={styles.limpar} onClick={limparFiltros}>
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {eventos && total > 0 && (
          <ul className={atualizando ? `${styles.lista} ${styles.atualizando}` : styles.lista} aria-busy={atualizando}>
            {eventos.map((item) => (
              <li key={item.evento.id}>
                <EventoCard item={item} />
              </li>
            ))}
          </ul>
        )}

        {eventos && total > 0 && (temMais || mostrando < total) && (
          <div className={styles.paginacao}>
            <p className={styles.paginacaoTexto} aria-live="polite">
              Mostrando {mostrando} de {total} eventos
            </p>
            {temMais && (
              <Botao variante="secundario" larguraTotal={false} carregando={carregandoMais} onClick={carregarMais}>
                Carregar mais eventos
              </Botao>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
