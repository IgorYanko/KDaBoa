/**
 * DTOs do KdABoa: o formato dos dados trocados entre o front e a API.
 *
 * Fontes usadas para montar este arquivo:
 * - API atual (mock) em src/controllers do backend: nomes e formatos que já existem.
 * - Issue #4 (schema do banco): campos que o banco vai ter.
 * - Esboço das telas no Figma: campos que as telas pedem.
 *
 * Convenções:
 * - Os campos seguem o padrão da API: snake_case (ex.: data_inicio).
 * - Datas trafegam como texto ISO 8601 (ex.: "2026-11-13T21:00:00Z").
 * - Campos marcados com "PENDENTE" ainda não existem na API; o front usa mock
 *   para eles até o backend e o banco ficarem prontos. Ao implementar, o backend
 *   deve usar os mesmos nomes.
 * - Regra do projeto: não renomear nem remover campos daqui sem combinar com o
 *   backend (João Pedro) e o banco (Rafael).
 */

// ---------------------------------------------------------------------------
// Tipos base
// ---------------------------------------------------------------------------

/** Identificador UUID em texto (usuários, eventos, mensagens...). */
export type Uuid = string;

/** Data e hora em ISO 8601, ex.: "2026-11-13T21:00:00Z". */
export type DataIso = string;

/** Data sem hora, ex.: "2006-03-30". */
export type DataSimples = string;

/** Resposta de erro padrão da API. Ex.: { "erro": "E-mail ou senha inválidos" } */
export interface ErroApiDTO {
  erro: string;
}

/** Resposta padrão de ações que só confirmam algo. */
export interface MensagemDTO {
  mensagem: string;
}

// ---------------------------------------------------------------------------
// Categorias e locais
// ---------------------------------------------------------------------------

/** GET /api/categorias. Também são as opções de "O que você curte?" no cadastro. */
export interface CategoriaDTO {
  id: number;
  nome: string;
}

/** GET /api/locais */
export interface LocalDTO {
  id: number;
  nome: string;
  endereco: string;
  capacidade: number;
  /** CEP (o banco já tem a coluna). */
  cep?: string | null;
  /** Bairro (o banco já tem a coluna). */
  bairro?: string | null;
  /** PENDENTE: coordenadas para o mapa (issue #25). */
  latitude?: number;
  /** PENDENTE: coordenadas para o mapa (issue #25). */
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Usuário e autenticação
// ---------------------------------------------------------------------------

/** Dados públicos de um usuário (o que outras pessoas podem ver). */
/**
 * Perfil de acesso (vem no login e no token): conta comum, empresa (CNPJ) ou admin.
 * ADMIN pode editar e excluir qualquer evento.
 */
export type PerfilUsuario = 'USUARIO' | 'ORGANIZADOR' | 'ADMIN';
/** Mesmo tipo, nome usado nas regras de permissão. */
export type PerfilAcesso = PerfilUsuario;

export interface UsuarioResumoDTO {
  id: Uuid;
  nome: string;
  /** Conta comum, empresa (CNPJ) ou admin. Só vem no login (o usuário logado). */
  perfil?: PerfilUsuario;
  /** PENDENTE: @usuario exibido em Quem vai e no Perfil. */
  apelido?: string;
  /** PENDENTE: URL da foto; sem foto, o front mostra as iniciais. */
  foto_url?: string | null;
}

/** Dados completos do usuário logado (tela de Perfil). */
export interface UsuarioDTO extends UsuarioResumoDTO {
  email: string;
  /** Ausente na conta CNPJ. */
  data_nascimento?: DataSimples | null;
  cnpj?: string | null;
  nome_fantasia?: string | null;
  /** PENDENTE: ids das categorias de interesse (issue #4). */
  interesses?: number[];
  /** PENDENTE: se outras pessoas veem quando ele confirma presença (issue #4). */
  mostrar_presenca?: boolean;
  /** PENDENTE: se recebe lembrete de evento por e-mail (issues #4 e #42). */
  receber_lembretes?: boolean;
}

/** POST /api/usuarios/login: corpo enviado. */
export interface LoginRequestDTO {
  email: string;
  senha: string;
}

/** POST /api/usuarios/login: resposta 200. Em erro (401): ErroApiDTO. */
export interface LoginResponseDTO {
  mensagem: string;
  /** Token enviado no header Authorization: Bearer <token>. Hoje é falso (mock). */
  token: string;
  usuario: UsuarioResumoDTO;
}

/** POST /api/usuarios/cadastro: corpo enviado. */
export interface CadastroRequestDTO {
  /** `cnpj` cria a conta de empresa, que só publica evento verificado. */
  tipo?: 'pessoa' | 'cnpj';
  nome: string;
  email: string;
  /** Mínimo de 8 caracteres (regra da tela de cadastro). */
  senha: string;
  data_nascimento: DataSimples;
  cnpj?: string;
  nome_fantasia?: string;
  /** PENDENTE na API: ids das categorias escolhidas em "O que você curte?". */
  interesses: number[];
  /** PENDENTE na API: switch "Mostrar minha presença". */
  mostrar_presenca: boolean;
}

/**
 * POST /api/usuarios/cadastro: resposta 201.
 * Em erro: ErroApiDTO (ex.: 409 "E-mail já cadastrado", 400 dados inválidos).
 */
export interface CadastroResponseDTO {
  mensagem: string;
  usuario: Pick<UsuarioDTO, 'id' | 'nome' | 'email' | 'data_nascimento'>;
}

/**
 * Pedir o e-mail de redefinição de senha (issue #18, já na API).
 * POST /api/auth/esqueci-senha. O link do e-mail abre /redefinir-senha?token=... e vale 1 hora.
 */
export interface EsqueciSenhaRequestDTO {
  email: string;
}

/**
 * Resposta do pedido de redefinição (issue #18). A API responde igual para e-mail com ou sem conta,
 * para não revelar quem tem cadastro; pedir de novo invalida o link anterior.
 */
export interface EsqueciSenhaResponseDTO {
  mensagem: string;
}

/**
 * Definir a nova senha com o token recebido por e-mail (issue #18, já na API).
 * POST /api/auth/redefinir-senha. A API aceita a senha nova como `senha` (ou `novaSenha`).
 */
export interface RedefinirSenhaRequestDTO {
  token: string;
  senha: string;
}

/** Resposta da redefinição (issue #18). */
export interface RedefinirSenhaResponseDTO {
  mensagem: string;
}

/** PENDENTE (issue #41): campos editáveis no Perfil. */
export type AtualizarPerfilRequestDTO = Partial<
  Pick<UsuarioDTO, 'nome' | 'interesses' | 'mostrar_presenca' | 'receber_lembretes'>
>;

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

/** GET /api/eventos e GET /api/eventos/:id */
export interface EventoDTO {
  id: Uuid;
  titulo: string;
  descricao: string;
  data_inicio: DataIso;
  /** PENDENTE (issue #27): horário de término, para "21h às 2h" no detalhe. */
  data_fim?: DataIso | null;
  /** Preço em reais; 0 = gratuito. */
  preco: number;
  /** Idade mínima; 0 = livre. */
  classificacao_etaria: number;
  /** Evento publicado por conta CNPJ. */
  verificado?: boolean;
  /** Ingresso cobrado neste app. Falso: preço na portaria ou gratuito. */
  venda_no_app?: boolean;
  /** Ingressos ainda disponíveis quando a venda é no app. */
  quantidade_ingressos?: number | null;
  categoria_id: number;
  local_id: number;
  criador_id: Uuid;
  /** PENDENTE (issue #27): quem organiza, para "Organizado por ..." no detalhe. */
  organizador?: UsuarioResumoDTO;
  /** PENDENTE (issue #46): caminho/URL da imagem de capa. */
  capa_url?: string | null;
  /** PENDENTE (issue #25): coordenadas do evento para o mapa. */
  latitude?: number;
  /** PENDENTE (issue #25): coordenadas do evento para o mapa. */
  longitude?: number;
  /** PENDENTE (issue #29): quantas pessoas confirmaram presença. */
  total_confirmados?: number;
  /** PENDENTE (issue #29): se o usuário logado confirmou presença. */
  eu_vou?: boolean;
  /**
   * PENDENTE (issues #29/#31): algumas pessoas que vão (até 4), para as bolinhas
   * com iniciais no card e no detalhe. Respeita quem escolheu não mostrar presença.
   */
  participantes_amostra?: UsuarioResumoDTO[];
}

/** PENDENTE (issue #23): filtros da listagem (GET /api/eventos?...). */
export interface FiltroEventosDTO {
  busca?: string;
  /** "hoje", "fim-de-semana" ou "este-mes", como nos chips da tela Início. */
  periodo?: 'hoje' | 'fim-de-semana' | 'este-mes';
  categoria_id?: number;
}

/**
 * PENDENTE (issue #44): local novo informado no Divulgar, com o endereço preenchido pelo ViaCEP.
 * A API ainda não cria locais; até aceitar este campo, o evento precisa de um `local_id` da lista.
 */
export interface NovoLocalDTO {
  nome: string;
  cep: string;
  /** "Rua Tal, 150 - Centro" (o mesmo formato dos locais da lista). */
  endereco: string;
  bairro: string;
}

/** PUT /api/eventos/:id — os mesmos campos do criar; só o criador ou um ADMIN pode alterar. */
export type AtualizarEventoRequestDTO = Partial<CriarEventoRequestDTO>;

/** PENDENTE (issue #45): corpo enviado na tela Divulgar evento. Vai `local_id` (da lista) ou `novo_local`. */
export interface CriarEventoRequestDTO {
  titulo: string;
  descricao: string;
  data_inicio: DataIso;
  preco: number;
  classificacao_etaria: number;
  categoria_id: number;
  local_id?: number;
  novo_local?: NovoLocalDTO;
  venda_no_app?: boolean;
  quantidade_ingressos?: number;
}

// ---------------------------------------------------------------------------
// Presença e social
// ---------------------------------------------------------------------------

/**
 * PENDENTE (issue #39): eventos em que o usuário logado confirmou presença,
 * separados pela data do evento. Rota sugerida: GET /api/usuarios/me/agenda (exige login).
 * Próximos em ordem de data; passados do mais recente para o mais antigo.
 */
export interface AgendaDTO {
  proximos: EventoDTO[];
  passados: EventoDTO[];
}

/** Ingresso emitido depois do pagamento aprovado. */
export interface IngressoDTO {
  id: Uuid;
  codigo: string;
  status: 'valido' | 'usado' | 'cancelado';
  evento_id: Uuid;
  evento_titulo: string;
  data_inicio: DataIso;
}

/** POST /api/eventos/:id/pagamentos e GET /api/pedidos/:id */
export interface PagamentoPedidoDTO {
  id: Uuid;
  evento_id: Uuid;
  quantidade: number;
  valor_total: number;
  status: 'pendente' | 'pago' | 'recusado' | 'cancelado';
  qr_code?: string | null;
  qr_code_base64?: string | null;
  ingressos: { id: Uuid; codigo: string; status: string }[];
}

/** PENDENTE (issue #29): resposta de confirmar/cancelar presença. */
export interface PresencaDTO {
  evento_id: Uuid;
  usuario_id: Uuid;
  criado_em: DataIso;
}

/** PENDENTE (issue #31): uma pessoa na lista Quem vai. */
export interface ParticipanteDTO extends UsuarioResumoDTO {
  /** Se o usuário logado segue essa pessoa. */
  seguindo: boolean;
}

/** PENDENTE (issue #39): números do topo do Perfil. */
export interface ContadoresPerfilDTO {
  proximos: number;
  seguindo: number;
  seguidores: number;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

/**
 * Mensagem do chat de um evento (issue #33), como o servidor de socket manda
 * em `historico_mensagens` e `nova_mensagem`. O id vem do banco como número, convertido em texto.
 */
export interface MensagemChatDTO {
  id: string;
  evento_id: Uuid;
  autor: UsuarioResumoDTO;
  texto: string;
  criado_em: DataIso;
}

/** Corpo do evento `enviar_mensagem` do socket (vai junto com o `evento_id`). */
export interface EnviarMensagemRequestDTO {
  texto: string;
}

/**
 * PENDENTE (issue #35): bloquear um usuário a partir do chat (issue #34).
 * Rota sugerida: POST /api/bloqueios. O histórico e as mensagens novas devem ocultar o bloqueado só para quem bloqueou.
 */
export interface BloquearUsuarioRequestDTO {
  usuario_id: Uuid;
}

/**
 * PENDENTE (issue #37): denunciar uma mensagem do chat (issue #36).
 * Rota sugerida: POST /api/denuncias. O banco guarda uma denúncia por pessoa e mensagem; motivo com até 255 caracteres.
 */
export interface DenunciarMensagemRequestDTO {
  /** id da mensagem (vem do banco como número, convertido em texto). */
  mensagem_id: string;
  motivo: string;
}
