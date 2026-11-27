import { API_URL } from '../config';
import type { ErroApiDTO } from '../dtos';
import { lerSessao, limparSessao } from './sessao';

/** Disparado quando a API recusa o token (401). O AuthContext escuta e desloga. */
export const EVENTO_SESSAO_ENCERRADA = 'kdaboa:sessao-encerrada';

/**
 * Disparado quando alguma requisição passa de alguns segundos (detail = true) e quando
 * todas as lentas terminam (detail = false). O servidor gratuito do Render "dorme" e a
 * primeira requisição pode levar até 1 minuto: a tela avisa em vez de parecer travada.
 */
export const EVENTO_API_LENTA = 'kdaboa:api-lenta';
const TEMPO_LENTO_MS = 4000;
let lentasEmAndamento = 0;

function avisarLentidao(lenta: boolean): void {
  lentasEmAndamento = Math.max(0, lentasEmAndamento + (lenta ? 1 : -1));
  window.dispatchEvent(new CustomEvent(EVENTO_API_LENTA, { detail: lentasEmAndamento > 0 }));
}

/** Erro de uma requisição. `mensagem` já está pronta para mostrar na tela. */
export class ErroApi extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface Opcoes {
  metodo?: Metodo;
  corpo?: unknown;
}

/**
 * Faz uma requisição para a API e devolve o JSON já tipado.
 * Envia o token da sessão, se houver. Em erro, lança ErroApi com a mensagem
 * que a API mandou em { erro }.
 */
export async function requisicao<T>(caminho: string, { metodo = 'GET', corpo }: Opcoes = {}): Promise<T> {
  const cabecalhos: Record<string, string> = { Accept: 'application/json' };
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';

  const sessao = lerSessao();
  if (sessao) cabecalhos.Authorization = `Bearer ${sessao.token}`;

  let resposta: Response;
  let ficouLenta = false;
  const relogio = setTimeout(() => {
    ficouLenta = true;
    avisarLentidao(true);
  }, TEMPO_LENTO_MS);
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor. Confira a internet e tente de novo.', 0);
  } finally {
    clearTimeout(relogio);
    if (ficouLenta) avisarLentidao(false);
  }

  const dados: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // Token recusado pela API: encerra a sessão para as rotas privadas voltarem a exigir login.
    if (resposta.status === 401 && sessao) {
      limparSessao();
      window.dispatchEvent(new Event(EVENTO_SESSAO_ENCERRADA));
    }
    const erro = (dados as Partial<ErroApiDTO> | null)?.erro;
    // Sem mensagem da API (ex.: erro 500 inesperado), uma frase clara em vez de detalhes técnicos.
    let padrao = 'Algo deu errado. Tente de novo.';
    if (resposta.status >= 500) padrao = 'O servidor teve um problema. Tente de novo em instantes.';
    // 404 sem { erro } = a rota não existe no servidor (ainda não foi feita no backend).
    else if (resposta.status === 404) padrao = 'Essa função ainda não está disponível no servidor.';
    throw new ErroApi(erro ?? padrao, resposta.status);
  }

  return dados as T;
}
