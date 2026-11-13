/** Usa os mocks locais enquanto a API/banco não estão prontos. Padrão: true. */
export const USAR_MOCK = import.meta.env.VITE_USAR_MOCK !== 'false';

/** Endereço da API do backend. */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
