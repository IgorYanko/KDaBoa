import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ErroApi } from '../../api/client';
import iconeLocal from '../../assets/icones/local.svg';
import iconeMais from '../../assets/icones/mais.svg';
import { Aviso } from '../../components/Aviso';
import { CampoBusca } from '../../components/CampoBusca';
import { EventoCard } from '../../components/EventoCard';
import { IconeMascara } from '../../components/IconeMascara';
import { Segmentos } from '../../components/Segmentos';
import { useAuth } from '../../contexts/useAuth';
import type { FiltroEventosDTO } from '../../dtos';
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

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [eventos, setEventos] = useState<EventoCompleto[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Espera a pessoa parar de digitar antes de buscar.
  useEffect(() => {
    const espera = setTimeout(() => setBuscaAplicada(busca), 250);
    return () => clearTimeout(espera);
  }, [busca]);

  useEffect(() => {
    let ativo = true;
    setErro(null);
    listarEventos({ busca: buscaAplicada || undefined, periodo: periodo ?? undefined })
      .then((lista) => {
        if (ativo) setEventos(lista);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar os eventos.');
      });
    return () => {
      ativo = false;
    };
  }, [buscaAplicada, periodo]);

  const total = eventos?.length ?? 0;

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <div className={styles.saudacao}>
          <p className={styles.cidade}>
            <IconeMascara src={iconeLocal} tamanho={14} />
            Pouso Alegre, MG
          </p>
          <h1 className={styles.titulo}>{primeiroNome ? `Bora sair, ${primeiroNome}?` : 'Bora sair?'}</h1>
        </div>
        <Link to="/divulgar" className={styles.divulgar} aria-label="Divulgar um evento">
          <img src={iconeMais} alt="" width={20} height={20} />
        </Link>
      </header>

      <CampoBusca
        rotulo="Buscar eventos"
        placeholder="Buscar shows, festas, lugares…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <Segmentos rotulo="Quando" opcoes={PERIODOS} selecionado={periodo} onMudar={setPeriodo} />

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

        {!eventos && !erro && <p className={styles.vazio}>Carregando eventos…</p>}

        {eventos && total === 0 && (
          <p className={styles.vazio}>Nenhum evento encontrado. Tente outra busca ou outro período.</p>
        )}

        {eventos && total > 0 && (
          <ul className={styles.lista}>
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
