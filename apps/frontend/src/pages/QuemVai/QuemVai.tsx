import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { BotaoIcone } from '../../components/BotaoIcone';
import { CampoBusca } from '../../components/CampoBusca';
import { Icone } from '../../components/Icone';
import { useAuth } from '../../contexts/useAuth';
import type { ParticipanteDTO } from '../../dtos';
import { buscarEvento, type EventoCompleto } from '../../services/eventos';
import { deixarDeSeguir, listarParticipantes, seguirUsuario } from '../../services/social';
import { PessoaLinha } from './PessoaLinha';
import styles from './QuemVai.module.css';

function semAcento(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Tela 5 · Quem vai (issue #30): confirmados com presença visível, busca e seguir. */
export function QuemVai() {
  const { id = '' } = useParams();
  const { usuario } = useAuth();
  const [item, setItem] = useState<EventoCompleto | null>(null);
  const [pessoas, setPessoas] = useState<ParticipanteDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroSeguir, setErroSeguir] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());

  useEffect(() => {
    let ativo = true;
    Promise.all([buscarEvento(id), listarParticipantes(id)])
      .then(([evento, lista]) => {
        if (!ativo) return;
        setItem(evento);
        setPessoas(lista);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar quem vai.');
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  function trocarSeguindo(pessoaId: string, seguindo: boolean) {
    setPessoas((atual) => atual?.map((p) => (p.id === pessoaId ? { ...p, seguindo } : p)) ?? null);
  }

  function marcarOcupado(pessoaId: string, ocupado: boolean) {
    setOcupados((atual) => {
      const novo = new Set(atual);
      if (ocupado) novo.add(pessoaId);
      else novo.delete(pessoaId);
      return novo;
    });
  }

  /** Muda o botão na hora e desfaz se a API recusar. */
  async function alternarSeguir(pessoa: ParticipanteDTO) {
    const seguir = !pessoa.seguindo;
    setErroSeguir(null);
    trocarSeguindo(pessoa.id, seguir);
    marcarOcupado(pessoa.id, true);
    try {
      await (seguir ? seguirUsuario(pessoa.id) : deixarDeSeguir(pessoa.id));
    } catch (e) {
      trocarSeguindo(pessoa.id, !seguir);
      setErroSeguir(e instanceof ErroApi ? e.message : 'Não foi possível atualizar. Tente de novo.');
    } finally {
      marcarOcupado(pessoa.id, false);
    }
  }

  const evento = item?.evento;
  const total = evento?.total_confirmados ?? 0;
  const lista = pessoas ?? [];
  const termo = semAcento(busca.trim());
  const filtradas = termo
    ? lista.filter((p) => semAcento(`${p.nome} ${p.apelido ?? ''}`).includes(termo))
    : lista;
  const ocultas = Math.max(0, total - lista.length);
  const minhaPresencaOculta = Boolean(evento?.eu_vou && pessoas && !lista.some((p) => p.id === usuario?.id));

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <BotaoIcone icone="voltar" rotulo="Voltar para o evento" para={`/eventos/${id}`} />
        <div className={styles.titulos}>
          <h1 className={styles.titulo}>Quem vai</h1>
          {evento && (
            <p className={styles.subtitulo}>
              {evento.titulo} · {total} {total === 1 ? 'confirmado' : 'confirmados'}
            </p>
          )}
        </div>
      </header>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {pessoas && (
        <>
          {lista.length > 0 && (
            <CampoBusca
              rotulo="Buscar pelo nome"
              placeholder="Buscar pelo nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          )}

          <p className={styles.nota}>
            <Icone nome="olho" tamanho={18} />
            <span>Só aparece aqui quem deixou a presença visível no perfil.</span>
          </p>

          {minhaPresencaOculta && (
            <p className={styles.nota}>
              <Icone nome="olho-fechado" tamanho={18} />
              <span>
                Você confirmou, mas sua presença está oculta.{' '}
                <Link to="/perfil" className={styles.notaLink}>
                  Mudar no perfil
                </Link>
              </span>
            </p>
          )}

          {erroSeguir && <Aviso tipo="erro">{erroSeguir}</Aviso>}

          {lista.length === 0 ? (
            <div className={styles.vazio}>
              <span className={styles.vazioIcone}>
                <Icone nome="pessoas" tamanho={22} />
              </span>
              <p className={styles.vazioTitulo}>Ninguém com presença visível</p>
              <p className={styles.vazioTexto}>
                {total > 0
                  ? 'Quem confirmou preferiu não aparecer na lista.'
                  : 'Ninguém confirmou ainda. Que tal ser a primeira pessoa?'}
              </p>
            </div>
          ) : filtradas.length === 0 ? (
            <p className={styles.semResultado}>Ninguém com esse nome na lista.</p>
          ) : (
            <ul className={styles.lista} aria-label="Pessoas que vão">
              {filtradas.map((pessoa) => (
                <PessoaLinha
                  key={pessoa.id}
                  pessoa={pessoa}
                  posicao={lista.indexOf(pessoa)}
                  eu={pessoa.id === usuario?.id}
                  ocupado={ocupados.has(pessoa.id)}
                  onAlternarSeguir={() => alternarSeguir(pessoa)}
                />
              ))}
            </ul>
          )}

          {ocultas > 0 && lista.length > 0 && !termo && (
            <p className={styles.ocultas}>
              + {ocultas} {ocultas === 1 ? 'pessoa confirmou' : 'pessoas confirmaram'} com a presença oculta
            </p>
          )}
        </>
      )}

      {!pessoas && !erro && (
        <ul className={styles.lista} aria-label="Carregando quem vai">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className={styles.esqueleto} aria-hidden="true" />
          ))}
        </ul>
      )}
    </main>
  );
}
