import { API_URL } from '../config';
import type { ErroApiDTO } from '../dtos';
import { lerSessao } from './sessao';

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
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor. Tente de novo.', 0);
  }

  const dados: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = (dados as Partial<ErroApiDTO> | null)?.erro;
    throw new ErroApi(erro ?? 'Algo deu errado. Tente de novo.', resposta.status);
  }

  return dados as T;
}
