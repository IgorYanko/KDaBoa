import type { NomeIcone } from '../components/Icone';
import type { CategoriaDTO } from '../dtos';

/**
 * Cores e ícones das categorias e avatares.
 * As cores são as variáveis --cor-categoria-N de styles/tokens.css.
 */

interface EstiloCategoria {
  /** Número da variável --cor-categoria-N. */
  numero: number;
  icone: NomeIcone;
}

/** Estilo de cada categoria pelo começo do nome (funciona com os nomes do mock e da API). */
const ESTILO_POR_NOME: [string, EstiloCategoria][] = [
  ['show', { numero: 1, icone: 'musica' }], // laranja
  ['cultura', { numero: 2, icone: 'cultura' }], // azul
  ['teatro', { numero: 2, icone: 'teatro' }], // azul (o esboço não tem cor própria para Teatro)
  ['festa', { numero: 3, icone: 'festa' }], // rosa
  ['gastronomia', { numero: 4, icone: 'gastronomia' }], // amarelo
  ['esporte', { numero: 5, icone: 'esporte' }], // verde
];

function semAcento(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Cor e ícone de uma categoria pelo nome; undefined se o nome não for de uma categoria conhecida. */
export function estiloPeloNome(nome: string): { cor: string; icone: NomeIcone } | undefined {
  const normalizado = semAcento(nome);
  const encontrado = ESTILO_POR_NOME.find(([prefixo]) => normalizado.startsWith(prefixo));
  if (!encontrado) return undefined;
  return { cor: `var(--cor-categoria-${encontrado[1].numero})`, icone: encontrado[1].icone };
}

/** Cor de uma categoria (ex.: Shows = laranja). Sem correspondência, usa uma cor pelo id. */
export function corDaCategoria(categoria?: CategoriaDTO): string {
  if (!categoria) return 'var(--cor-categoria-1)';
  const estilo = estiloPeloNome(categoria.nome);
  if (estilo) return estilo.cor;
  return `var(--cor-categoria-${((Math.abs(categoria.id) - 1) % 5) + 1})`;
}

/** Ícone de uma categoria (ex.: Shows = nota musical). Sem correspondência, usa um brilho. */
export function iconeDaCategoria(categoria?: CategoriaDTO): NomeIcone {
  return (categoria && estiloPeloNome(categoria.nome)?.icone) || 'brilho';
}

/** Cor do avatar pela posição na lista (azul, laranja, verde, amarelo...). */
export function corDoAvatar(posicao: number): string {
  const ordem = [2, 1, 5, 4, 3];
  return `var(--cor-categoria-${ordem[posicao % ordem.length]})`;
}

/** "Ana Souza" → "AS" */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}
