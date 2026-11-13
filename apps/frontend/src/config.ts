const usarMockEnv = import.meta.env.VITE_USAR_MOCK;

/**
 * Usa os mocks locais enquanto a API/banco não estão prontos.
 * - Em desenvolvimento (npm run dev): ligado, a menos que VITE_USAR_MOCK=false.
 * - No build de produção (npm run build): desligado, a menos que VITE_USAR_MOCK=true
 *   seja definido de propósito. Assim a versão publicada nunca cai no mock sozinha.
 */
export const USAR_MOCK = import.meta.env.DEV ? usarMockEnv !== 'false' : usarMockEnv === 'true';

/** Endereço da API do backend. */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
