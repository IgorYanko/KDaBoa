import type { CadastroRequestDTO } from '../../dtos';

export type ErrosCadastro = Partial<Record<keyof CadastroRequestDTO, string>>;

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida o formulário de cadastro no front. Devolve um objeto vazio se estiver tudo certo. */
export function validarCadastro(dados: CadastroRequestDTO): ErrosCadastro {
  const erros: ErrosCadastro = {};

  if (!dados.nome.trim()) erros.nome = 'Informe seu nome.';

  if (!dados.email.trim()) erros.email = 'Informe seu e-mail.';
  else if (!EMAIL_VALIDO.test(dados.email.trim())) erros.email = 'E-mail inválido.';

  if (!dados.data_nascimento) erros.data_nascimento = 'Informe a data.';
  else if (new Date(dados.data_nascimento) > new Date()) erros.data_nascimento = 'Data no futuro.';

  if (dados.senha.length < 8) erros.senha = 'Mínimo de 8 caracteres.';

  if (dados.interesses.length === 0) erros.interesses = 'Escolha pelo menos um interesse.';

  return erros;
}
