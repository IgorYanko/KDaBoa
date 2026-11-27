export type Bandeira = 'visa' | 'master' | 'amex' | 'elo' | 'hipercard' | 'neutro';

const PREFIXOS_ELO = [
  '401178',
  '401179',
  '431274',
  '438935',
  '451416',
  '457393',
  '457631',
  '457632',
  '504175',
  '506699',
  '5067',
  '509',
  '627780',
  '636297',
  '636368',
  '650',
  '6516',
  '6550',
];

/** Bandeira a partir do BIN (os primeiros dígitos que o Mercado Pago informa). */
export function bandeiraDoBin(bin: string): Bandeira {
  const digitos = bin.replace(/\D/g, '');
  if (!digitos) return 'neutro';
  if (PREFIXOS_ELO.some((prefixo) => digitos.startsWith(prefixo))) return 'elo';
  if (digitos.startsWith('3841') || digitos.startsWith('606282')) return 'hipercard';
  if (/^3[47]/.test(digitos)) return 'amex';
  // 50–55 cobre a Mastercard clássica e o BIN 5031 dos cartões de teste do Mercado Pago.
  // Prefixos Elo que também começam com 50 já foram resolvidos acima.
  if (/^(5[0-5]|2[2-7])/.test(digitos)) return 'master';
  if (digitos.startsWith('4')) return 'visa';
  return 'neutro';
}

export function nomeDaBandeira(bandeira: Bandeira): string {
  switch (bandeira) {
    case 'visa':
      return 'Visa';
    case 'master':
      return 'Mastercard';
    case 'amex':
      return 'American Express';
    case 'elo':
      return 'Elo';
    case 'hipercard':
      return 'Hipercard';
    default:
      return 'Cartão';
  }
}

/** Mostra o BIN já digitado e mascara o resto. Amex usa 15 posições. */
export function numeroMascarado(bin: string, bandeira: Bandeira): string {
  const tamanho = bandeira === 'amex' ? 15 : 16;
  const base = `${bin.replace(/\D/g, '')}${'•'.repeat(tamanho)}`.slice(0, tamanho);
  if (bandeira === 'amex') {
    return `${base.slice(0, 4)} ${base.slice(4, 10)} ${base.slice(10)}`.trim();
  }
  return base.replace(/(.{4})/g, '$1 ').trim();
}

/** MM/AA a partir do que foi digitado. Vazio continua como placeholder. */
export function validadeExibida(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (!digitos) return 'MM/AA';
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

/** CVV digitado. Amex tem 4 dígitos; as outras bandeiras, 3. */
export function cvvExibido(valor: string, bandeira: Bandeira): string {
  const tamanho = bandeira === 'amex' ? 4 : 3;
  const digitos = valor.replace(/\D/g, '').slice(0, tamanho);
  return digitos || '•'.repeat(tamanho);
}
