import type { LocalDTO } from '../dtos';

/** Locais do esboço. O mock atual do backend tem outros (Teatro Municipal...). */
export const locaisMock: LocalDTO[] = [
  { id: 1, nome: 'Bar do Centro', endereco: 'Rua Comendador José Garcia, 150 - Centro', capacidade: 200 },
  { id: 2, nome: 'Praça Central', endereco: 'Praça Senador José Bento - Centro', capacidade: 1000 },
  { id: 3, nome: 'Espaço de Eventos', endereco: 'Av. Vereador Antônio da Costa Rios, 800', capacidade: 1500 },
  { id: 4, nome: 'Parque Municipal', endereco: 'Av. Prefeito Olavo Gomes de Oliveira', capacidade: 3000 },
  { id: 5, nome: 'Avenida principal', endereco: 'Av. Dr. Lisboa - Centro', capacidade: 500 },
];
