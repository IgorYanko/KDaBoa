import type { CadastroRequestDTO } from '../../dtos';

export type ErrosCadastro = Partial<Record<keyof CadastroRequestDTO, string>>;

/**
 * Idade mínima para criar conta. 17 anos segue o público-alvo do README (17 a 25).
 * Decisão de produto: confirmar com o PO e alinhar com a mesma regra no backend.
 */
export const IDADE_MINIMA = 17;
const IDADE_MAXIMA = 120;

export const SENHA_MINIMA = 8;
/** Teto da senha, para não mandar textos enormes para o hash do backend. */
export const SENHA_MAXIMA = 128;

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Data civil de hoje no fuso do aparelho, como "AAAA-MM-DD" (sem passar por UTC). */
export function hojeLocal(agora = new Date()): string {
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

/** Última data de nascimento aceita: hoje menos a idade mínima ("AAAA-MM-DD"). */
export function nascimentoMaximo(agora = new Date()): string {
  return hojeLocal(new Date(agora.getFullYear() - IDADE_MINIMA, agora.getMonth(), agora.getDate()));
}

/**
 * Idade completa em anos na data local de hoje, comparando ano, mês e dia
 * (sem `new Date("AAAA-MM-DD")`, que seria meia-noite UTC). Null se a data for inválida.
 */
export function idadeEmAnos(nascimento: string, agora = new Date()): number | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascimento);
  if (!partes) return null;
  const [ano, mes, dia] = partes.slice(1).map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;

  let idade = agora.getFullYear() - ano;
  const mesAtual = agora.getMonth() + 1;
  if (mesAtual < mes || (mesAtual === mes && agora.getDate() < dia)) idade -= 1;
  return idade;
}

/** Valida o formulário de cadastro no front. Devolve um objeto vazio se estiver tudo certo. */
export function validarCadastro(dados: CadastroRequestDTO, agora = new Date()): ErrosCadastro {
  const erros: ErrosCadastro = {};

  if (!dados.nome.trim()) erros.nome = 'Informe seu nome.';

  if (!dados.email.trim()) erros.email = 'Informe seu e-mail.';
  else if (!EMAIL_VALIDO.test(dados.email.trim())) erros.email = 'E-mail inválido.';

  if (!dados.data_nascimento) {
    erros.data_nascimento = 'Informe a data.';
  } else {
    const idade = idadeEmAnos(dados.data_nascimento, agora);
    if (idade === null || idade < 0 || idade > IDADE_MAXIMA) erros.data_nascimento = 'Data inválida.';
    else if (idade < IDADE_MINIMA) erros.data_nascimento = `Mínimo de ${IDADE_MINIMA} anos.`;
  }

  if (dados.senha.length < SENHA_MINIMA) erros.senha = `Mínimo de ${SENHA_MINIMA} caracteres.`;
  else if (dados.senha.length > SENHA_MAXIMA) erros.senha = `Máximo de ${SENHA_MAXIMA} caracteres.`;

  if (dados.interesses.length === 0) erros.interesses = 'Escolha pelo menos um interesse.';

  return erros;
}
