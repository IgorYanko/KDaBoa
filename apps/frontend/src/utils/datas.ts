import type { DataIso } from '../dtos';

/** Funções de data usadas nas telas. Tudo no fuso do navegador e em pt-BR. */

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "13" */
export function dia(data: DataIso): string {
  return String(new Date(data).getDate());
}

/** "NOV" */
export function mesCurto(data: DataIso): string {
  return MESES[new Date(data).getMonth()].slice(0, 3).toUpperCase();
}

/** "SEX" */
export function diaSemanaCurto(data: DataIso): string {
  return DIAS_CURTOS[new Date(data).getDay()].toUpperCase();
}

/** "21h" ou "19h30" */
export function hora(data: DataIso): string {
  const d = new Date(data);
  const minutos = d.getMinutes();
  return `${d.getHours()}h${minutos ? String(minutos).padStart(2, '0') : ''}`;
}

/** "Sex · 21h" (usado no card) */
export function diaEHora(data: DataIso): string {
  return `${DIAS_CURTOS[new Date(data).getDay()]} · ${hora(data)}`;
}

/** "Sexta, 13 de novembro" */
export function dataLonga(data: DataIso): string {
  const d = new Date(data);
  return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "21h às 2h" ou só "21h" quando não há término. */
export function intervaloHoras(inicio: DataIso, fim?: DataIso | null): string {
  return fim ? `${hora(inicio)} às ${hora(fim)}` : hora(inicio);
}

function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Início e fim (exclusivo) de cada período dos filtros da tela Início. */
export function intervaloDoPeriodo(periodo: 'hoje' | 'fim-de-semana' | 'este-mes', agora = new Date()): [Date, Date] {
  const hoje = inicioDoDia(agora);
  if (periodo === 'hoje') {
    return [hoje, new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)];
  }
  if (periodo === 'este-mes') {
    return [hoje, new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)];
  }
  // Fim de semana: de sexta a domingo desta semana (se hoje já é fim de semana, a partir de hoje).
  const diaSemana = hoje.getDay(); // 0 = domingo
  const diasAteSexta = diaSemana === 0 ? -2 : 5 - diaSemana;
  const sexta = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diasAteSexta);
  const segunda = new Date(sexta.getFullYear(), sexta.getMonth(), sexta.getDate() + 3);
  return [sexta < hoje ? hoje : sexta, segunda];
}
