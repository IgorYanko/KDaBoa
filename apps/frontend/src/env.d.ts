/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" para usar os dados de src/mocks; "false" para chamar a API. */
  readonly VITE_USAR_MOCK?: string;
  /** Endereço da API. Padrão: http://localhost:3333 */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
