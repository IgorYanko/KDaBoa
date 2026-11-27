import type { Server } from 'socket.io';

/**
 * Guarda o servidor do socket.io para as rotas HTTP avisarem em tempo real.
 * Cada usuário logado entra na sala `usuario:<id>` ao conectar (ver socket.ts).
 */
let io: Server | null = null;

export function definirServidorTempoReal(servidor: Server | null): void {
  io = servidor;
}

export function salaDoUsuario(usuarioId: string): string {
  return `usuario:${usuarioId}`;
}

/** Envia um evento para todas as conexões abertas de um usuário (sem servidor, não faz nada). */
export function avisarUsuario(usuarioId: string, evento: string, dados: unknown): void {
  io?.to(salaDoUsuario(usuarioId)).emit(evento, dados);
}
