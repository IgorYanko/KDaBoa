import type { CriarEventoRequestDTO } from '../../dtos';
import { digitosDoCep, formatarCep } from '../../services/cep';

/** Valores do formulário Divulgar (como digitados; viram o DTO em `paraRequisicao`). */
export interface FormularioEvento {
  titulo: string;
  descricao: string;
  categoriaId: number | null;
  /** "aaaa-mm-dd" */
  data: string;
  /** "hh:mm" */
  horario: string;
  /** "lista" = um local já cadastrado · "novo" = endereço pelo CEP (issue #44). */
  modoLocal: 'lista' | 'novo';
  localId: string;
  novoLocalNome: string;
  cep: string;
  /** Rua: o ViaCEP preenche (dá para corrigir). */
  logradouro: string;
  numero: string;
  bairro: string;
  /** "Pouso Alegre/MG", vindo do ViaCEP (só para mostrar). */
  cidade: string;
  /** Texto livre: "", "25" ou "25,50". Vazio = gratuito. */
  preco: string;
  /** Idade mínima ("0" = livre). */
  classificacao: string;
}

export type ErrosEvento = Partial<Record<keyof FormularioEvento, string>>;

export const TITULO_MAXIMO = 150;
export const DESCRICAO_MAXIMA = 1000;

export const FORMULARIO_INICIAL: FormularioEvento = {
  titulo: '',
  descricao: '',
  categoriaId: null,
  data: '',
  horario: '',
  modoLocal: 'lista',
  localId: '',
  novoLocalNome: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  preco: '',
  classificacao: '0',
};

/** "25,50" → 25.5 · "" → 0 · texto inválido → null */
export function lerPreco(texto: string): number | null {
  const limpo = texto.trim().replace(/^R\$\s*/i, '');
  if (!limpo) return 0;
  if (!/^\d+([.,]\d{1,2})?$/.test(limpo)) return null;
  return Number(limpo.replace(',', '.'));
}

/** Data e horário do formulário em ISO (fuso do navegador); null se faltar algum. */
export function dataInicioIso(formulario: FormularioEvento): string | null {
  if (!formulario.data || !formulario.horario) return null;
  const data = new Date(`${formulario.data}T${formulario.horario}:00`);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

/** "aaaa-mm-dd" de hoje (mínimo do campo de data). */
export function hojeIso(agora = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function validarEvento(formulario: FormularioEvento, agora = new Date()): ErrosEvento {
  const erros: ErrosEvento = {};
  const titulo = formulario.titulo.trim();

  if (!titulo) erros.titulo = 'Dê um nome ao evento.';
  else if (titulo.length > TITULO_MAXIMO) erros.titulo = `O nome pode ter até ${TITULO_MAXIMO} caracteres.`;

  if (!formulario.descricao.trim()) erros.descricao = 'Conte um pouco sobre o evento.';
  if (formulario.categoriaId === null) erros.categoriaId = 'Escolha uma categoria.';

  if (!formulario.data) erros.data = 'Escolha a data.';
  if (!formulario.horario) erros.horario = 'Escolha o horário.';
  const inicio = dataInicioIso(formulario);
  if (inicio && new Date(inicio) <= agora) erros.data = 'A data e o horário precisam ser no futuro.';

  if (formulario.modoLocal === 'lista') {
    if (!formulario.localId) erros.localId = 'Escolha o local.';
  } else {
    if (!formulario.novoLocalNome.trim()) erros.novoLocalNome = 'Dê um nome ao local.';
    if (digitosDoCep(formulario.cep).length !== 8) erros.cep = 'Informe o CEP (8 números).';
    else if (!formulario.cidade) erros.cep = 'Busque o CEP para preencher o endereço.';
    if (!formulario.logradouro.trim()) erros.logradouro = 'Informe a rua.';
    if (!formulario.numero.trim()) erros.numero = 'Informe o número (ou s/n).';
  }
  if (lerPreco(formulario.preco) === null) erros.preco = 'Use só números, como 25 ou 25,50.';

  return erros;
}

/** Corpo do POST /api/eventos (chame depois de validar). */
export function paraRequisicao(formulario: FormularioEvento): CriarEventoRequestDTO {
  return {
    titulo: formulario.titulo.trim(),
    descricao: formulario.descricao.trim(),
    data_inicio: dataInicioIso(formulario) ?? '',
    preco: lerPreco(formulario.preco) ?? 0,
    classificacao_etaria: Number(formulario.classificacao),
    categoria_id: formulario.categoriaId ?? 0,
    ...(formulario.modoLocal === 'novo'
      ? { novo_local: novoLocalDoFormulario(formulario) }
      : { local_id: Number(formulario.localId) }),
  };
}

/** "Rua Tal, 150 - Centro", no mesmo formato dos locais da lista. */
export function enderecoDoFormulario(formulario: FormularioEvento): string {
  const bairro = formulario.bairro.trim();
  return `${formulario.logradouro.trim()}, ${formulario.numero.trim()}${bairro ? ` - ${bairro}` : ''}`;
}

function novoLocalDoFormulario(formulario: FormularioEvento) {
  return {
    nome: formulario.novoLocalNome.trim(),
    cep: formatarCep(formulario.cep),
    endereco: enderecoDoFormulario(formulario),
    bairro: formulario.bairro.trim(),
  };
}
