import { useState } from 'react';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Icone } from '../../components/Icone';
import { Modal } from '../../components/Modal';
import type { MensagemChatDTO } from '../../dtos';
import { bloquearUsuario, denunciarMensagem, MOTIVO_MAXIMO } from '../../services/moderacao';
import styles from './AcoesMensagem.module.css';

const MOTIVOS = ['Spam ou propaganda', 'Ofensa ou assédio', 'Conteúdo impróprio', 'Golpe ou informação falsa'];
const OUTRO = 'Outro motivo';

type Passo = 'menu' | 'denunciar' | 'denunciado' | 'bloquear';

interface Props {
  /** Mensagem escolhida; null = janela fechada. */
  mensagem: MensagemChatDTO | null;
  aoFechar: () => void;
  /** Chamado depois que a API confirmou o bloqueio. */
  aoBloquear: (mensagem: MensagemChatDTO) => void;
}

/** Ações sobre a mensagem de outra pessoa no chat: denunciar (issue #36) e bloquear o autor (issue #34). */
export function AcoesMensagem({ mensagem, aoFechar, aoBloquear }: Props) {
  const [passo, setPasso] = useState<Passo>('menu');
  const [motivo, setMotivo] = useState('');
  const [detalhe, setDetalhe] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const nome = mensagem?.autor.nome ?? '';
  const primeiroNome = nome.split(' ')[0];

  function fechar() {
    setPasso('menu');
    setMotivo('');
    setDetalhe('');
    setErro(null);
    setEnviando(false);
    aoFechar();
  }

  function irPara(novo: Passo) {
    setErro(null);
    setPasso(novo);
  }

  async function enviarDenuncia() {
    if (!mensagem) return;
    const texto = motivo === OUTRO ? detalhe.trim() : motivo;
    if (!texto) {
      setErro(motivo === OUTRO ? 'Conte em poucas palavras o que aconteceu.' : 'Escolha o motivo da denúncia.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await denunciarMensagem({ mensagem_id: mensagem.id, motivo: texto });
      setPasso('denunciado');
    } catch (e) {
      // Não finge que denunciou: mostra o erro e deixa tentar de novo.
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível enviar a denúncia. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarBloqueio() {
    if (!mensagem) return;
    setErro(null);
    setEnviando(true);
    try {
      await bloquearUsuario(mensagem.autor.id);
      aoBloquear(mensagem);
      fechar();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível bloquear. Tente de novo.');
      setEnviando(false);
    }
  }

  return (
    <Modal aberto={mensagem !== null} aoFechar={fechar} idTitulo="titulo-acoes-mensagem">
      <div className={styles.corpo}>
        {passo === 'menu' && (
          <>
            <h2 id="titulo-acoes-mensagem" className={styles.titulo}>
              Mensagem de {nome}
            </h2>
            <blockquote className={styles.citacao}>{mensagem?.texto}</blockquote>
            <div className={styles.lista}>
              <button type="button" className={styles.acao} onClick={() => irPara('denunciar')}>
                <Icone nome="bandeira" tamanho={20} />
                <span className={styles.acaoTextos}>
                  <span className={styles.acaoTitulo}>Denunciar mensagem</span>
                  <span className={styles.acaoDescricao}>Avise a equipe sobre algo que não deveria estar aqui</span>
                </span>
              </button>
              <button type="button" className={`${styles.acao} ${styles.perigo}`} onClick={() => irPara('bloquear')}>
                <Icone nome="bloquear" tamanho={20} />
                <span className={styles.acaoTextos}>
                  <span className={styles.acaoTitulo}>Bloquear {primeiroNome}</span>
                  <span className={styles.acaoDescricao}>Você deixa de ver as mensagens dessa pessoa</span>
                </span>
              </button>
            </div>
          </>
        )}

        {passo === 'denunciar' && (
          <>
            <h2 id="titulo-acoes-mensagem" className={styles.titulo}>
              Denunciar mensagem
            </h2>
            <p className={styles.texto}>A denúncia é anônima: {primeiroNome} não fica sabendo quem denunciou.</p>
            <fieldset className={styles.motivos}>
              <legend className={styles.legenda}>Qual o problema?</legend>
              {[...MOTIVOS, OUTRO].map((opcao) => (
                <label key={opcao} className={styles.motivo}>
                  <input
                    type="radio"
                    name="motivo"
                    value={opcao}
                    checked={motivo === opcao}
                    onChange={() => {
                      setMotivo(opcao);
                      setErro(null);
                    }}
                  />
                  {opcao}
                </label>
              ))}
            </fieldset>
            {motivo === OUTRO && (
              <label className={styles.detalhe}>
                <span className={styles.legenda}>Conte o que aconteceu</span>
                <textarea
                  rows={3}
                  maxLength={MOTIVO_MAXIMO}
                  value={detalhe}
                  onChange={(e) => setDetalhe(e.target.value)}
                  className={styles.caixa}
                />
              </label>
            )}
            {erro && <Aviso tipo="erro">{erro}</Aviso>}
            <div className={styles.botoes}>
              <Botao variante="secundario" onClick={() => irPara('menu')} disabled={enviando}>
                Voltar
              </Botao>
              <Botao carregando={enviando} onClick={enviarDenuncia}>
                Enviar denúncia
              </Botao>
            </div>
          </>
        )}

        {passo === 'denunciado' && (
          <div className={styles.sucesso} role="status">
            <span className={styles.selo}>
              <Icone nome="check" tamanho={24} traco={2.25} />
            </span>
            <h2 id="titulo-acoes-mensagem" className={styles.titulo}>
              Denúncia enviada
            </h2>
            <p className={styles.texto}>Obrigado por avisar. A equipe vai analisar a mensagem.</p>
            <Botao onClick={fechar}>Fechar</Botao>
          </div>
        )}

        {passo === 'bloquear' && (
          <>
            <h2 id="titulo-acoes-mensagem" className={styles.titulo}>
              Bloquear {nome}?
            </h2>
            <p className={styles.texto}>
              Você deixa de ver as mensagens de {primeiroNome} nos chats. As outras pessoas continuam vendo a conversa
              normalmente.
            </p>
            {erro && <Aviso tipo="erro">{erro}</Aviso>}
            <div className={styles.botoes}>
              <Botao variante="secundario" onClick={() => irPara('menu')} disabled={enviando}>
                Voltar
              </Botao>
              <Botao carregando={enviando} onClick={confirmarBloqueio} className={styles.botaoPerigo}>
                Bloquear
              </Botao>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
