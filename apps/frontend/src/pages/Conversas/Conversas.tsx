import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Icone } from '../../components/Icone';
import { useAuth } from '../../contexts/useAuth';
import type { ConversaDTO } from '../../dtos';
import { listarConversas, ouvirDiretas } from '../../services/conversas';
import { corDoAvatar, iniciais } from '../../utils/cores';
import { horaMinuto, rotuloDoDia } from '../../utils/datas';
import styles from './Conversas.module.css';

/** Cor fixa de cada pessoa (pelo id), igual à do chat. */
export function corDaPessoa(id: string): string {
  let soma = 0;
  for (const letra of id) soma += letra.charCodeAt(0);
  return corDoAvatar(soma);
}

/** "14:32" hoje; "Ontem", "Seg"… nos outros dias (o rótulo do dia do chat). */
function quando(iso: string): string {
  const rotulo = rotuloDoDia(iso);
  return rotulo === 'Hoje' ? horaMinuto(iso) : rotulo;
}

/** Tela · Conversas (chat mútuo): quem segue de volta e as conversas que já existem. */
export function Conversas() {
  const { usuario } = useAuth();
  const [conversas, setConversas] = useState<ConversaDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    listarConversas()
      .then((lista) => {
        setConversas(lista);
        setErro(null);
      })
      .catch((e) => setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar suas conversas.'));
  }, []);

  useEffect(() => {
    carregar();
    // Mensagem nova (de qualquer conversa) sobe a conversa para o topo.
    return ouvirDiretas(() => carregar());
  }, [carregar]);

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Conversas</h1>
        <p className={styles.subtitulo}>Com quem você segue e te segue de volta</p>
      </header>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {!conversas && !erro && (
        <ul className={styles.lista} aria-label="Carregando conversas">
          {[1, 2, 3].map((n) => (
            <li key={n} className={styles.esqueleto} aria-hidden="true" />
          ))}
        </ul>
      )}

      {conversas?.length === 0 && (
        <div className={styles.vazio}>
          <span className={styles.vazioIcone}>
            <Icone nome="chat" tamanho={22} />
          </span>
          <p className={styles.vazioTitulo}>Nenhuma conversa ainda</p>
          <p className={styles.vazioTexto}>
            Siga quem vai aos mesmos eventos que você. Quando a pessoa seguir de volta, vocês podem conversar aqui.
          </p>
        </div>
      )}

      {conversas && conversas.length > 0 && (
        <>
          <p className={styles.nota}>
            <Icone nome="cadeado" tamanho={18} />
            <span>Só dá para conversar quando os dois se seguem. Se alguém deixar de seguir, a conversa fica só para leitura.</span>
          </p>
          <ul className={styles.lista} aria-label="Conversas">
            {conversas.map(({ usuario: pessoa, pode_enviar, ultima_mensagem }) => {
              const estilo = { '--cor-avatar': corDaPessoa(pessoa.id) } as CSSProperties;
              const minha = ultima_mensagem?.remetente_id === usuario?.id;
              return (
                <li key={pessoa.id} className={styles.item}>
                  <Link to={`/conversas/${pessoa.id}`} className={styles.link}>
                    <span className={styles.avatar} style={estilo} aria-hidden="true">
                      {iniciais(pessoa.nome)}
                    </span>
                    <span className={styles.textos}>
                      <span className={styles.linhaTopo}>
                        <span className={styles.nome}>{pessoa.nome}</span>
                        {ultima_mensagem && (
                          <time className={styles.hora} dateTime={ultima_mensagem.criado_em}>
                            {quando(ultima_mensagem.criado_em)}
                          </time>
                        )}
                      </span>
                      {ultima_mensagem ? (
                        <span className={styles.previa}>
                          {minha ? 'Você: ' : ''}
                          {ultima_mensagem.texto}
                        </span>
                      ) : (
                        <span className={`${styles.previa} ${styles.previaNova}`}>Vocês se seguem. Diga oi!</span>
                      )}
                    </span>
                    {!pode_enviar && <span className={styles.selo}>Só leitura</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
