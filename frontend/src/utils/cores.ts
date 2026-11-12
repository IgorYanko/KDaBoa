import type { CategoriaDTO } from '../dtos';

/**
 * Cores do Figma usadas para categorias e avatares.
 * São as variáveis --cor-categoria-N de styles/tokens.css.
 */

/** Cor de cada categoria no esboço, pelo começo do nome (funciona com os nomes do mock e da API). */
const COR_POR_NOME: [string, number][] = [
  ['show', 1], // laranja
  ['cultura', 2], // azul
  ['teatro', 2], // azul (o esboço não tem cor própria para Teatro)
  ['festa', 3], // rosa
  ['gastronomia', 4], // amarelo
  ['esporte', 5], // verde
];

/** Cor de uma categoria (ex.: Shows = laranja). Sem correspondência, usa uma cor pelo id. */
export function corDaCategoria(categoria?: CategoriaDTO): string {
  if (!categoria) return 'var(--cor-categoria-1)';
  const nome = categoria.nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const encontrada = COR_POR_NOME.find(([prefixo]) => nome.startsWith(prefixo));
  const numero = encontrada ? encontrada[1] : ((Math.abs(categoria.id) - 1) % 5) + 1;
  return `var(--cor-categoria-${numero})`;
}

/** Cor do avatar pela posição na lista (como no Figma: azul, laranja, verde, amarelo...). */
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
