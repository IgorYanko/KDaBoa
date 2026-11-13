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
  /** PENDENTE: coordenadas para o mapa (issue #25). */
  latitude?: number;
  /** PENDENTE: coordenadas para o mapa (issue #25). */
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Usuário e autenticação
// ---------------------------------------------------------------------------

/** Dados públicos de um usuário (o que outras pessoas podem ver). */
export interface UsuarioResumoDTO {
  id: Uuid;
  nome: string;
  /** PENDENTE: @usuario exibido em Quem vai e no Perfil. */
  apelido?: string;
  /** PENDENTE: URL da foto; sem foto, o front mostra as iniciais. */
  foto_url?: string | null;
}

/** Dados completos do usuário logado (tela de Perfil). */
export interface UsuarioDTO extends UsuarioResumoDTO {
  email: string;
  data_nascimento: DataSimples;
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
  nome: string;
  email: string;
  /** Mínimo de 8 caracteres (regra da tela de cadastro). */
  senha: string;
  data_nascimento: DataSimples;
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

/** PENDENTE (issue #18): pedir o e-mail de redefinição de senha. */
export interface EsqueciSenhaRequestDTO {
  email: string;
}

/** PENDENTE (issue #18): definir a nova senha com o token recebido por e-mail. */
export interface RedefinirSenhaRequestDTO {
  token: string;
  nova_senha: string;
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

/** PENDENTE (issue #45): corpo enviado na tela Divulgar evento. */
export interface CriarEventoRequestDTO {
  titulo: string;
  descricao: string;
  data_inicio: DataIso;
  preco: number;
  classificacao_etaria: number;
  categoria_id: number;
  local_id: number;
}

// ---------------------------------------------------------------------------
// Presença e social
// ---------------------------------------------------------------------------

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

/** PENDENTE (issue #33): mensagem do chat de um evento. */
export interface MensagemChatDTO {
  id: Uuid;
  evento_id: Uuid;
  autor: UsuarioResumoDTO;
  texto: string;
  criado_em: DataIso;
}

/** PENDENTE (issue #33): corpo para enviar uma mensagem. */
export interface EnviarMensagemRequestDTO {
  texto: string;
}

/** PENDENTE (issue #35): bloquear um usuário. */
export interface BloquearUsuarioRequestDTO {
  usuario_id: Uuid;
}

/** PENDENTE (issue #37): denunciar uma mensagem. */
export interface DenunciarMensagemRequestDTO {
  mensagem_id: Uuid;
  motivo: string;
}
