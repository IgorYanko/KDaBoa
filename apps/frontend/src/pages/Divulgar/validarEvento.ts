import type { CriarEventoRequestDTO } from '../../dtos';

/** Valores do formulário Divulgar (como digitados; viram o DTO em `paraRequisicao`). */
export interface FormularioEvento {
  titulo: string;
  descricao: string;
  categoriaId: number | null;
  /** "aaaa-mm-dd" */
  data: string;
  /** "hh:mm" */
  horario: string;
  localId: string;
  /** Texto livre: "", "25" ou "25,50". Vazio = gratuito. */
  preco: string;
  /** Idade mínima ("0" = livre). */
  classificacao: string;
  /** Só conta CNPJ. Cobra o ingresso neste app. */
  vendaNoApp: boolean;
  quantidade: string;
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
  localId: '',
  preco: '',
  classificacao: '0',
  vendaNoApp: false,
  quantidade: '',
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

export function validarEvento(
  formulario: FormularioEvento,
  agora = new Date(),
  organizador = false,
): ErrosEvento {
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

  if (!formulario.localId) erros.localId = 'Escolha o local.';
  const preco = lerPreco(formulario.preco);
  if (preco === null) erros.preco = 'Use só números, como 25 ou 25,50.';

  if (organizador && formulario.vendaNoApp) {
    if (preco !== null && preco <= 0) erros.preco = 'A venda no app precisa de um preço.';
    if (!/^[1-9]\d*$/.test(formulario.quantidade.trim())) {
      erros.quantidade = 'Informe quantos ingressos estão à venda.';
    }
  }

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
    local_id: Number(formulario.localId),
    ...(formulario.vendaNoApp
      ? { venda_no_app: true, quantidade_ingressos: Number(formulario.quantidade) }
      : {}),
  };
}
