import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { classesBotao } from '../../components/Botao';
import { CartaoIngresso } from '../../components/CartaoIngresso';
import { EventoLinha } from '../../components/EventoLinha';
import { Icone } from '../../components/Icone';
import { Segmentos } from '../../components/Segmentos';
import type { IngressoDTO } from '../../dtos';
import { type AgendaCompleta, type EventoCompleto, listarAgenda } from '../../services/eventos';
import { listarMeusIngressos } from '../../services/pagamentos';
import { grupoDaAgenda, mesPorExtenso } from '../../utils/datas';
import styles from './Agenda.module.css';

type Aba = 'proximos' | 'passados' | 'ingressos';

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: 'proximos', rotulo: 'Próximos' },
  { valor: 'passados', rotulo: 'Passados' },
  { valor: 'ingressos', rotulo: 'Ingressos' },
];

interface Grupo {
  titulo: string;
  itens: EventoCompleto[];
}

/** Junta eventos vizinhos do mesmo período ("Este fim de semana", "Novembro"...). A lista já vem ordenada. */
function agrupar(lista: EventoCompleto[], aba: 'proximos' | 'passados'): Grupo[] {
  const grupos: Grupo[] = [];
  for (const item of lista) {
    const titulo =
      aba === 'proximos' ? grupoDaAgenda(item.evento.data_inicio) : mesPorExtenso(item.evento.data_inicio);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.titulo === titulo) ultimo.itens.push(item);
    else grupos.push({ titulo, itens: [item] });
  }
  return grupos;
}

/** Tela 6 · Minha agenda (issue #38): eventos com presença confirmada, em próximos e passados. */
export function Agenda() {
  const [params] = useSearchParams();
  const abaInicial = params.get('aba');
  const [aba, setAba] = useState<Aba>(abaInicial === 'passados' || abaInicial === 'ingressos' ? abaInicial : 'proximos');
  const [agenda, setAgenda] = useState<AgendaCompleta | null>(null);
  const [ingressos, setIngressos] = useState<IngressoDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Busca de novo a cada visita: confirmar ou cancelar presença no detalhe muda a lista.
  useEffect(() => {
    let ativo = true;
    listarAgenda()
      .then((resultado) => {
        if (ativo) setAgenda(resultado);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar sua agenda.');
      });
    listarMeusIngressos()
      .then((resultado) => {
        if (ativo) setIngressos(resultado);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar seus ingressos.');
      });
    return () => {
      ativo = false;
    };
  }, []);

  const lista = aba === 'ingressos' ? [] : (agenda?.[aba] ?? []);
  const grupos = aba === 'ingressos' ? [] : agrupar(lista, aba);

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Minha agenda</h1>
        <p className={styles.subtitulo}>
          {aba === 'ingressos' ? 'Ingressos que você comprou' : 'Eventos em que você confirmou presença'}
        </p>
      </header>

      <Segmentos rotulo="Mostrar" opcoes={ABAS} selecionado={aba} onMudar={(valor) => valor && setAba(valor)} />

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {aba === 'ingressos' && ingressos && ingressos.length === 0 && (
        <div className={styles.vazio}>
          <span className={styles.vazioIcone}>
            <Icone nome="ingresso" tamanho={22} />
          </span>
          <p className={styles.vazioTitulo}>Nenhum ingresso ainda</p>
          <p className={styles.vazioTexto}>Quando um pagamento for aprovado, o ingresso aparece aqui.</p>
        </div>
      )}

      {aba === 'ingressos' && ingressos && ingressos.length > 0 && (
        <ul className={styles.lista}>
          {ingressos.map((ingresso) => (
            <li key={ingresso.id}>
              <CartaoIngresso
                codigo={ingresso.codigo}
                titulo={ingresso.evento_titulo}
                dataInicio={ingresso.data_inicio}
                capaUrl={ingresso.capa_url}
                localNome={ingresso.local_nome}
                para={`/eventos/${ingresso.evento_id}`}
              />
            </li>
          ))}
        </ul>
      )}

      {aba !== 'ingressos' && !agenda && !erro && (
        <ul className={styles.lista} aria-label="Carregando agenda">
          {[1, 2, 3].map((n) => (
            <li key={n} className={styles.esqueleto} aria-hidden="true" />
          ))}
        </ul>
      )}

      {aba !== 'ingressos' && agenda && lista.length === 0 && (
        <div className={styles.vazio}>
          <span className={styles.vazioIcone}>
            <Icone nome="calendario" tamanho={22} />
          </span>
          {aba === 'proximos' ? (
            <>
              <p className={styles.vazioTitulo}>Nada na agenda por enquanto</p>
              <p className={styles.vazioTexto}>Toque em "Eu vou!" num evento e ele aparece aqui.</p>
              <Link to="/explorar" className={`${classesBotao({ tamanho: 'sm', larguraTotal: false })} ${styles.vazioBotao}`}>
                Ver eventos
              </Link>
            </>
          ) : (
            <>
              <p className={styles.vazioTitulo}>Nenhum evento passado</p>
              <p className={styles.vazioTexto}>Os eventos em que você foi ficam guardados aqui.</p>
            </>
          )}
        </div>
      )}

      {aba !== 'ingressos' && grupos.map((grupo) => {
        const idTitulo = `grupo-${aba}-${grupo.titulo.toLowerCase().replace(/\s+/g, '-')}`;
        return (
          <section key={grupo.titulo} className={styles.grupo} aria-labelledby={idTitulo}>
            <h2 id={idTitulo} className={styles.grupoTitulo}>
              {grupo.titulo}
            </h2>
            <ul className={styles.lista}>
              {grupo.itens.map((item) => (
                <li key={item.evento.id}>
                  <EventoLinha item={item} passado={aba === 'passados'} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {aba === 'proximos' && lista.length > 0 && (
        <Link to="/explorar" className={styles.procurar}>
          <Icone nome="busca" tamanho={18} />
          Procurar mais eventos
        </Link>
      )}
    </main>
  );
}
