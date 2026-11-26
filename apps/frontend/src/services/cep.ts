import { ErroApi } from '../api/client';

/**
 * Endereço de um CEP pelo ViaCEP (issue #44), serviço público e gratuito: https://viacep.com.br
 * É chamado direto do navegador, nos dois modos (mock e API).
 */

export interface EnderecoCep {
  /** "37550-000" */
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Resposta do ViaCEP (com `erro: true` quando o CEP não existe). */
interface RespostaViaCep {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

/** Só os números do CEP digitado. */
export function digitosDoCep(cep: string): string {
  return cep.replace(/\D/g, '').slice(0, 8);
}

/** "37550000" → "37550-000" (o hífen entra quando o sexto número chega). */
export function formatarCep(cep: string): string {
  const digitos = digitosDoCep(cep);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

/** GET https://viacep.com.br/ws/{cep}/json/ */
export async function buscarCep(cep: string): Promise<EnderecoCep> {
  const digitos = digitosDoCep(cep);
  if (digitos.length !== 8) throw new ErroApi('O CEP tem 8 números.', 400);

  let dados: RespostaViaCep;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    if (resposta.status === 400) throw new ErroApi('CEP inválido.', 400);
    dados = (await resposta.json()) as RespostaViaCep;
  } catch (e) {
    if (e instanceof ErroApi) throw e;
    throw new ErroApi('Não foi possível consultar o CEP agora. Tente de novo.', 0);
  }

  if (dados.erro) throw new ErroApi('CEP não encontrado. Confira os números.', 404);
  return {
    cep: dados.cep ?? formatarCep(digitos),
    logradouro: dados.logradouro ?? '',
    bairro: dados.bairro ?? '',
    cidade: dados.localidade ?? '',
    uf: dados.uf ?? '',
  };
}
