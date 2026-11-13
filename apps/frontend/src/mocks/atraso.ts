/** Simula o tempo de resposta de uma API real nos mocks. */
export function atraso(ms = 400): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}
