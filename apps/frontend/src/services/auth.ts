import { ErroApi, requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type {
  CadastroRequestDTO,
  CadastroResponseDTO,
  EsqueciSenhaRequestDTO,
  EsqueciSenhaResponseDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  RedefinirSenhaRequestDTO,
  RedefinirSenhaResponseDTO,
} from '../dtos';
import { atraso } from '../mocks/atraso';
import { criarTokenSenha, usarTokenSenha } from '../mocks/tokensSenha';
import { senhasMock, usuariosMock } from '../mocks/usuarios';

/** POST /api/auth/login */
export async function login(dados: LoginRequestDTO): Promise<LoginResponseDTO> {
  if (!USAR_MOCK) {
    return requisicao<LoginResponseDTO>('/api/auth/login', { metodo: 'POST', corpo: dados });
  }

  await atraso();
  const email = dados.email.trim().toLowerCase();
  const usuario = usuariosMock.find((u) => u.email === email);
  // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails têm conta.
  if (!usuario || senhasMock.get(email) !== dados.senha) {
    throw new ErroApi('E-mail ou senha inválidos', 401);
  }
  return {
    mensagem: 'Login realizado com sucesso',
    token: 'token_mock_do_front',
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      apelido: usuario.apelido,
      foto_url: usuario.foto_url,
      perfil: usuario.perfil ?? 'USUARIO',
    },
  };
}

/** POST /api/auth/cadastro */
export async function cadastrar(dados: CadastroRequestDTO): Promise<CadastroResponseDTO> {
  if (!USAR_MOCK) {
    return requisicao<CadastroResponseDTO>('/api/auth/cadastro', { metodo: 'POST', corpo: dados });
  }

  await atraso();
  const email = dados.email.trim().toLowerCase();
  if (usuariosMock.some((u) => u.email === email)) {
    throw new ErroApi('E-mail já cadastrado', 409);
  }
  const novo = {
    // crypto.randomUUID não existe em http fora do localhost (ex.: testando no celular pela rede)
    id: `mock-${Date.now()}`,
    nome: dados.nome.trim(),
    email,
    data_nascimento: dados.data_nascimento,
    interesses: dados.interesses,
    mostrar_presenca: dados.mostrar_presenca,
  };
  usuariosMock.push(novo);
  senhasMock.set(email, dados.senha);
  return {
    mensagem: 'Usuário cadastrado com sucesso!',
    usuario: { id: novo.id, nome: novo.nome, email: novo.email, data_nascimento: novo.data_nascimento },
  };
}

/** Resposta do pedido de redefinição, com o link do e-mail quando é o mock (lá não há e-mail). */
export interface RespostaPedidoSenha extends EsqueciSenhaResponseDTO {
  /** Só no modo mock: o caminho que iria no e-mail (/redefinir-senha?token=...), para testar o fluxo. */
  link_teste?: string;
}

const MENSAGEM_RECUPERACAO = 'E-mail de recuperação enviado com sucesso';

/** POST /api/auth/esqueci-senha (issue #18): envia o e-mail com o link de redefinição. */
export async function pedirRedefinicaoSenha(dados: EsqueciSenhaRequestDTO): Promise<RespostaPedidoSenha> {
  if (!USAR_MOCK) {
    return requisicao<EsqueciSenhaResponseDTO>('/api/auth/esqueci-senha', { metodo: 'POST', corpo: dados });
  }

  await atraso();
  const email = dados.email.trim().toLowerCase();
  // Como a API: mesma resposta para e-mail sem conta, só que sem link.
  if (!usuariosMock.some((u) => u.email === email)) {
    return { mensagem: MENSAGEM_RECUPERACAO };
  }
  return { mensagem: MENSAGEM_RECUPERACAO, link_teste: `/redefinir-senha?token=${criarTokenSenha(email)}` };
}

/** POST /api/auth/redefinir-senha (issue #18): grava a nova senha usando o token do e-mail. */
export async function redefinirSenha(dados: RedefinirSenhaRequestDTO): Promise<RedefinirSenhaResponseDTO> {
  if (!USAR_MOCK) {
    return requisicao<RedefinirSenhaResponseDTO>('/api/auth/redefinir-senha', { metodo: 'POST', corpo: dados });
  }

  await atraso();
  const email = usarTokenSenha(dados.token);
  if (!email) {
    throw new ErroApi('Token inválido, expirado ou já utilizado', 400);
  }
  senhasMock.set(email, dados.senha);
  return { mensagem: 'Senha redefinida com sucesso' };
}
