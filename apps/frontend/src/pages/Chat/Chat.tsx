import { type CSSProperties, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { classesBotao } from '../../components/Botao';
import { BotaoEnviar } from '../../components/BotaoEnviar';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Icone } from '../../components/Icone';
import { useAuth } from '../../contexts/useAuth';
import type { MensagemChatDTO } from '../../dtos';
import { type ConexaoChat, conectarChat, TEXTO_MAXIMO } from '../../services/chat';
import { type EventoCompleto, buscarEvento } from '../../services/eventos';
import { corDaCategoria, corDoAvatar, iniciais } from '../../utils/cores';
import { dia, horaMinuto, mesCurto, rotuloDoDia } from '../../utils/datas';
import styles from './Chat.module.css';

/** Mensagens da mesma pessoa com até 5 minutos de diferença ficam no mesmo grupo. */
const JANELA_GRUPO = 5 * 60 * 1000;

/** Cor fixa de cada pessoa (pelo id), para o nome e o avatar não mudarem entre visitas. */
function corDaPessoa(id: string): string {
  let soma = 0;
  for (const letra of id) soma += letra.charCodeAt(0);
  return corDoAvatar(soma);
}

function mesmoGrupo(a: MensagemChatDTO | undefined, b: MensagemChatDTO | undefined): boolean {
  if (!a || !b || a.autor.id !== b.autor.id) return false;
  if (rotuloDoDia(a.criado_em) !== rotuloDoDia(b.criado_em)) return false;
  return Math.abs(new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()) < JANELA_GRUPO;
}

/** Tela · Chat do evento (issues #32 a #34). Só para quem confirmou presença. */
export function Chat() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const local = useLocation();
  const { usuario } = useAuth();

  const [item, setItem] = useState<EventoCompleto | null>(null);
  const [erroEvento, setErroEvento] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChatDTO[] | null>(null);
  const [erroChat, setErroChat] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const conexao = useRef<ConexaoChat | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let ativo = true;
    buscarEvento(id)
      .then((resultado) => {
        if (ativo) setItem(resultado);
      })
      .catch((e) => {
        if (ativo) setErroEvento(e instanceof ErroApi ? e.message : 'Não foi possível carregar o evento.');
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  const podeEntrar = item?.evento.eu_vou === true;

  // Entra na sala quando o evento confirma a presença; sai ao deixar a tela.
  useEffect(() => {
    if (!podeEntrar) return;
    setMensagens(null);
    setErroChat(null);
    const nova = conectarChat(id, {
      aoReceberHistorico: setMensagens,
      aoReceberMensagem: (mensagem) =>
        setMensagens((atual) => {
          if (!atual) return [mensagem];
          return atual.some((m) => m.id === mensagem.id) ? atual : [...atual, mensagem];
        }),
      aoErrar: setErroChat,
    });
    conexao.current = nova;
    return () => {
      nova.sair();
      conexao.current = null;
    };
  }, [id, podeEntrar]);

  // Sempre mostra a mensagem mais recente.
  useEffect(() => {
    if (mensagens) fim.current?.scrollIntoView({ block: 'end' });
  }, [mensagens]);

  // A caixa de texto cresce até ~5 linhas (e volta ao tamanho de uma linha quando esvazia).
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    el.style.height = 'auto';
    if (texto) el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [texto]);

  function voltar() {
    if (local.key === 'default') navegar(`/eventos/${id}`);
    else navegar(-1);
  }

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const limpo = texto.trim();
    if (!limpo || !conexao.current || enviando) return;
    setEnviando(true);
    try {
      await conexao.current.enviar(limpo);
      setTexto('');
      setErroChat(null);
    } catch (e) {
      setErroChat(e instanceof ErroApi ? e.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setEnviando(false);
      caixa.current?.focus();
    }
  }

  function aoTeclar(evento: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia; Shift+Enter quebra a linha.
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault();
      enviar();
    }
  }

  if (erroEvento) {
    return (
      <main className={styles.estado}>
        <Aviso tipo="erro">{erroEvento}</Aviso>
        <Link to="/inicio" className={styles.linkDestaque}>
          Voltar para o início
        </Link>
      </main>
    );
  }

  if (!item) {
    return (
      <main className={styles.estado}>
        <p className={styles.carregando}>Carregando chat…</p>
      </main>
    );
  }

  const { evento, categoria } = item;
  const estilo = { '--cor-evento': corDaCategoria(categoria) } as CSSProperties;

  if (!podeEntrar) {
    return (
      <main className={styles.estado}>
        <div className={styles.bloqueado}>
          <span className={styles.bloqueadoIcone}>
            <Icone nome="cadeado" tamanho={24} />
          </span>
          <h1 className={styles.bloqueadoTitulo}>Chat só para quem vai</h1>
          <p className={styles.bloqueadoTexto}>
            Confirme presença em <strong>{evento.titulo}</strong> para entrar na conversa.
          </p>
          <Link to={`/eventos/${evento.id}`} className={classesBotao()}>
            Voltar ao evento
          </Link>
        </div>
      </main>
    );
  }

  const total = evento.total_confirmados ?? 0;

  return (
    <main className={styles.tela} style={estilo}>
      <header className={styles.topo}>
        <BotaoIcone icone="voltar" rotulo="Voltar para o evento" variante="fantasma" onClick={voltar} />
        <span className={styles.selo} aria-hidden="true">
          <span className={styles.seloDia}>{dia(evento.data_inicio)}</span>
          <span className={styles.seloMes}>{mesCurto(evento.data_inicio)}</span>
        </span>
        <div className={styles.topoTextos}>
          <h1 className={styles.titulo}>{evento.titulo}</h1>
          <p className={styles.subtitulo}>
            {total} {total === 1 ? 'confirmado' : 'confirmados'} · chat do evento
          </p>
        </div>
        <BotaoIcone icone="pessoas" rotulo="Ver quem vai" variante="fantasma" para={`/eventos/${evento.id}/quem-vai`} />
      </header>

      <div className={styles.conversa} role="log" aria-label="Mensagens do chat">
        <p className={styles.regra}>
          <Icone nome="cadeado" tamanho={13} />
          Só quem confirmou presença vê e participa desta conversa.
        </p>

        {mensagens === null && !erroChat && <p className={styles.carregando}>Carregando conversa…</p>}

        {mensagens?.length === 0 && (
          <div className={styles.vazio}>
            <p className={styles.vazioTitulo}>Ninguém falou nada ainda</p>
            <p>Puxe o assunto: quem chega cedo? Alguém quer dividir carona?</p>
          </div>
        )}

        {mensagens?.map((mensagem, i) => {
          const anterior = mensagens[i - 1];
          const proxima = mensagens[i + 1];
          const novoDia = !anterior || rotuloDoDia(anterior.criado_em) !== rotuloDoDia(mensagem.criado_em);
          const inicioGrupo = !mesmoGrupo(anterior, mensagem);
          const fimGrupo = !mesmoGrupo(mensagem, proxima);
          const minha = mensagem.autor.id === usuario?.id;
          const corPessoa = { '--cor-pessoa': corDaPessoa(mensagem.autor.id) } as CSSProperties;

          const classesLinha = [
            styles.linha,
            minha ? styles.minha : styles.outra,
            inicioGrupo && styles.inicioGrupo,
            fimGrupo && styles.fimGrupo,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={mensagem.id} className={styles.bloco}>
              {novoDia && <p className={styles.dia}>{rotuloDoDia(mensagem.criado_em)}</p>}
              <div className={classesLinha} style={corPessoa}>
                {!minha &&
                  (fimGrupo ? (
                    <span className={styles.avatar} aria-hidden="true">
                      {iniciais(mensagem.autor.nome)}
                    </span>
                  ) : (
                    <span className={styles.espacoAvatar} />
                  ))}
                <div className={styles.mensagem}>
                  {!minha && inicioGrupo && <p className={styles.nome}>{mensagem.autor.nome}</p>}
                  <p className={styles.bolha}>
                    <span className={styles.somenteLeitor}>{minha ? 'Você' : mensagem.autor.nome}: </span>
                    {mensagem.texto}
                  </p>
                  {fimGrupo && (
                    <time className={styles.hora} dateTime={mensagem.criado_em}>
                      {horaMinuto(mensagem.criado_em)}
                    </time>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={fim} />
      </div>

      <form className={styles.envio} onSubmit={enviar}>
        {erroChat && <Aviso tipo="erro">{erroChat}</Aviso>}
        <div className={styles.envioLinha}>
          <label htmlFor="mensagem-chat" className={styles.somenteLeitor}>
            Mensagem para o grupo
          </label>
          <textarea
            id="mensagem-chat"
            ref={caixa}
            rows={1}
            className={styles.caixa}
            placeholder="Mensagem para o grupo"
            maxLength={TEXTO_MAXIMO}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            disabled={mensagens === null}
          />
          <BotaoEnviar disabled={!texto.trim() || enviando || mensagens === null} />
        </div>
      </form>
    </main>
  );
}
