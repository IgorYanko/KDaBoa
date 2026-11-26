import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
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
import { type EventoCompleto, listarEventos } from '../../services/eventos';
import styles from './Inicio.module.css';

type Periodo = NonNullable<FiltroEventosDTO['periodo']>;

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'fim-de-semana', rotulo: 'Fim de semana' },
  { valor: 'este-mes', rotulo: 'Este mês' },
];

/** Tela 3 · Início (issue #22). */
export function Inicio() {
  const { usuario } = useAuth();
  const primeiroNome = usuario?.nome.split(' ')[0];
  // Vindo do detalhe depois de excluir um evento.
  const excluido = (useLocation().state as { excluido?: string } | null)?.excluido;

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [eventos, setEventos] = useState<EventoCompleto[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  /** Buscando de novo após mudar um filtro (a lista anterior fica apagada até chegar a nova). */
  const [atualizando, setAtualizando] = useState(false);

  // Espera a pessoa parar de digitar antes de buscar.
  useEffect(() => {
    const espera = setTimeout(() => setBuscaAplicada(busca), 250);
    return () => clearTimeout(espera);
  }, [busca]);

  // Categorias para o filtro (se falhar, a tela segue sem a fileira).
  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    let ativo = true;
    setErro(null);
    setAtualizando(true);
    listarEventos({
      busca: buscaAplicada || undefined,
      periodo: periodo ?? undefined,
      categoria_id: categoriaId ?? undefined,
    })
      .then((lista) => {
        if (ativo) setEventos(lista);
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
  }, [buscaAplicada, periodo, categoriaId]);

  const total = eventos?.length ?? 0;
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
      </section>
    </main>
  );
}
