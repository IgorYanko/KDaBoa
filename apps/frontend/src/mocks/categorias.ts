import type { CategoriaDTO } from '../dtos';

/**
 * Categorias do esboço (cadastro e divulgar evento).
 * Obs.: o mock atual do backend tem outros nomes ("Shows e Música ao Vivo"...);
 * quando o banco existir, a lista real virá de GET /api/categorias.
 */
export const categoriasMock: CategoriaDTO[] = [
  { id: 1, nome: 'Shows' },
  { id: 2, nome: 'Festas' },
  { id: 3, nome: 'Cultura' },
  { id: 4, nome: 'Esporte' },
  { id: 5, nome: 'Gastronomia' },
  { id: 6, nome: 'Teatro' },
];
