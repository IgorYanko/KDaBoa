import type { LocalDTO } from '../dtos';

/**
 * Locais do esboço. O mock atual do backend tem outros (Teatro Municipal...).
 * Coordenadas aproximadas em Pouso Alegre, só para o mapa do modo mock (issue #25).
 */
export const locaisMock: LocalDTO[] = [
  {
    id: 1,
    nome: 'Bar do Centro',
    endereco: 'Rua Comendador José Garcia, 150 - Centro',
    capacidade: 200,
    latitude: -22.2297,
    longitude: -45.9339,
  },
  {
    id: 2,
    nome: 'Praça Central',
    endereco: 'Praça Senador José Bento - Centro',
    capacidade: 1000,
    latitude: -22.2306,
    longitude: -45.9363,
  },
  {
    id: 3,
    nome: 'Espaço de Eventos',
    endereco: 'Av. Vereador Antônio da Costa Rios, 800',
    capacidade: 1500,
    latitude: -22.2402,
    longitude: -45.9255,
  },
  {
    id: 4,
    nome: 'Parque Municipal',
    endereco: 'Av. Prefeito Olavo Gomes de Oliveira',
    capacidade: 3000,
    latitude: -22.2362,
    longitude: -45.9198,
  },
  {
    id: 5,
    nome: 'Avenida principal',
    endereco: 'Av. Dr. Lisboa - Centro',
    capacidade: 500,
    latitude: -22.2279,
    longitude: -45.9402,
  },
];
