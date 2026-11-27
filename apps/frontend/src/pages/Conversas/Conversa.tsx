import { type CSSProperties, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { BotaoEnviar } from '../../components/BotaoEnviar';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Icone } from '../../components/Icone';
import { useAuth } from '../../contexts/useAuth';
import type { ConversaAbertaDTO, MensagemDiretaDTO } from '../../dtos';
import { TEXTO_MAXIMO } from '../../services/chat';
import { abrirConversa, enviarDireta, ouvirDiretas } from '../../services/conversas';
import { iniciais } from '../../utils/cores';
import { horaMinuto, rotuloDoDia } from '../../utils/datas';
import chat from '../Chat/Chat.module.css';
import styles from './Conversa.module.css';
import { corDaPessoa } from './Conversas';

/** Mensagens da mesma pessoa com até 5 minutos de diferença ficam no mesmo grupo (como no chat do evento). */
const JANELA_GRUPO = 5 * 60 * 1000;

function mesmoGrupo(a: MensagemDiretaDTO | undefined, b: MensagemDiretaDTO | undefined): boolean {
  if (!a || !b || a.remetente_id !== b.remetente_id) return false;
  if (rotuloDoDia(a.criado_em) !== rotuloDoDia(b.criado_em)) return false;
  return Math.abs(new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()) < JANELA_GRUPO;
}

/** Tela · Conversa com uma pessoa (chat mútuo). Só manda mensagem quem se segue nos dois sentidos. */
export function Conversa() {
  const { usuarioId = '' } = useParams();
  const navegar = useNavigate();
  const local = useLocation();
  const { usuario } = useAuth();

  const [conversa, setConversa] = useState<ConversaAbertaDTO | null>(null);
  const [erroAbrir, setErroAbrir] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const fim = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let ativo = true;
    setConversa(null);
    setErroAbrir(null);
    abrirConversa(usuarioId)
      .then((resultado) => {
        if (ativo) setConversa(resultado);
      })
      .catch((e) => {
        if (ativo) setErroAbrir(e instanceof ErroApi ? e.message : 'Não foi possível abrir a conversa.');
      });
    // Mensagens novas desta conversa chegam em tempo real (as minhas também, sem repetir).
    const parar = ouvirDiretas((mensagem) => {
      if (mensagem.remetente_id !== usuarioId && mensagem.destinatario_id !== usuarioId) return;
      setConversa((atual) => {
        if (!atual || atual.mensagens.some((m) => m.id === mensagem.id)) return atual;
        return { ...atual, mensagens: [...atual.mensagens, mensagem] };
      });
    });
    return () => {
      ativo = false;
      parar();
    };
  }, [usuarioId]);

  // Sempre mostra a mensagem mais recente.
  useEffect(() => {
    if (conversa) fim.current?.scrollIntoView({ block: 'end' });
  }, [conversa]);

  // A caixa de texto cresce até ~5 linhas.
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    el.style.height = 'auto';
    if (texto) el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [texto]);

  function voltar() {
    if (local.key === 'default') navegar('/conversas');
    else navegar(-1);
  }

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const limpo = texto.trim();
    if (!limpo || enviando || !conversa?.pode_enviar) return;
    setEnviando(true);
    try {
      const nova = await enviarDireta(usuarioId, limpo);
      setConversa((atual) =>
        atual && !atual.mensagens.some((m) => m.id === nova.id)
          ? { ...atual, mensagens: [...atual.mensagens, nova] }
          : atual,
      );
      setTexto('');
      setErroEnvio(null);
    } catch (e) {
      setErroEnvio(e instanceof ErroApi ? e.message : 'Não foi possível enviar a mensagem.');
      // 403: alguém deixou de seguir enquanto a tela estava aberta → vira só leitura.
      if (e instanceof ErroApi && e.status === 403) setConversa((atual) => (atual ? { ...atual, pode_enviar: false } : atual));
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

  if (erroAbrir) {
    return (
      <main className={chat.estado}>
        <div className={chat.bloqueado}>
          <span className={chat.bloqueadoIcone}>
            <Icone nome="cadeado" tamanho={24} />
          </span>
          <h1 className={chat.bloqueadoTitulo}>Conversa indisponível</h1>
          <p className={chat.bloqueadoTexto}>{erroAbrir}</p>
          <Link to="/conversas" className={chat.linkDestaque}>
            Ver minhas conversas
          </Link>
        </div>
      </main>
    );
  }

  if (!conversa) {
    return (
      <main className={chat.estado}>
        <p className={chat.carregando}>Carregando conversa…</p>
      </main>
    );
  }

  const pessoa = conversa.usuario;
  const corOutra = { '--cor-pessoa': corDaPessoa(pessoa.id) } as CSSProperties;
  const { mensagens } = conversa;

  return (
    <main className={chat.tela}>
      <header className={chat.topo}>
        <BotaoIcone icone="voltar" rotulo="Voltar para as conversas" variante="fantasma" onClick={voltar} />
        <span className={styles.avatarTopo} style={corOutra} aria-hidden="true">
          {iniciais(pessoa.nome)}
        </span>
        <div className={chat.topoTextos}>
          <h1 className={chat.titulo}>{pessoa.nome}</h1>
          <p className={chat.subtitulo}>{conversa.pode_enviar ? 'Vocês se seguem' : 'Conversa só para leitura'}</p>
        </div>
      </header>

      <div className={chat.conversa} role="log" aria-label={`Conversa com ${pessoa.nome}`}>
        <p className={chat.regra}>
          <Icone nome="cadeado" tamanho={13} />
          Conversa privada entre vocês dois.
        </p>

        {mensagens.length === 0 && (
          <div className={chat.vazio}>
            <p className={chat.vazioTitulo}>Vocês se seguem!</p>
            <p>Mande um oi para {pessoa.nome.split(' ')[0]}. Que tal combinar o próximo evento?</p>
          </div>
        )}

        {mensagens.map((mensagem, i) => {
          const anterior = mensagens[i - 1];
          const proxima = mensagens[i + 1];
          const novoDia = !anterior || rotuloDoDia(anterior.criado_em) !== rotuloDoDia(mensagem.criado_em);
          const inicioGrupo = !mesmoGrupo(anterior, mensagem);
          const fimGrupo = !mesmoGrupo(mensagem, proxima);
          const minha = mensagem.remetente_id === usuario?.id;
          const classesLinha = [
            chat.linha,
            minha ? chat.minha : chat.outra,
            inicioGrupo && chat.inicioGrupo,
            fimGrupo && chat.fimGrupo,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={mensagem.id} className={chat.bloco}>
              {novoDia && <p className={chat.dia}>{rotuloDoDia(mensagem.criado_em)}</p>}
              <div className={classesLinha} style={corOutra}>
                {!minha &&
                  (fimGrupo ? (
                    <span className={chat.avatar} aria-hidden="true">
                      {iniciais(pessoa.nome)}
                    </span>
                  ) : (
                    <span className={chat.espacoAvatar} />
                  ))}
                <div className={chat.mensagem}>
                  <div className={chat.bolhaLinha}>
                    <p className={chat.bolha}>
                      <span className={chat.somenteLeitor}>{minha ? 'Você' : pessoa.nome}: </span>
                      {mensagem.texto}
                    </p>
                  </div>
                  {fimGrupo && (
                    <time className={chat.hora} dateTime={mensagem.criado_em}>
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

      <form className={chat.envio} onSubmit={enviar}>
        {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}
        {conversa.pode_enviar ? (
          <div className={chat.envioLinha}>
            <label htmlFor="mensagem-direta" className={chat.somenteLeitor}>
              Mensagem para {pessoa.nome}
            </label>
            <textarea
              id="mensagem-direta"
              ref={caixa}
              rows={1}
              className={chat.caixa}
              placeholder={`Mensagem para ${pessoa.nome.split(' ')[0]}`}
              maxLength={TEXTO_MAXIMO}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={aoTeclar}
            />
            <BotaoEnviar disabled={!texto.trim() || enviando} />
          </div>
        ) : (
          <p className={styles.somenteLeitura}>
            <Icone nome="cadeado" tamanho={18} />
            <span>Vocês não se seguem mais. Dá para ler a conversa, mas só volta a mandar mensagem se os dois se seguirem.</span>
          </p>
        )}
      </form>
    </main>
  );
}
