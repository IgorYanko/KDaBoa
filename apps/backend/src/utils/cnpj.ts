/** CNPJ com os dois dígitos verificadores. Aceita com ou sem máscara. */
export function cnpjValido(valor: string): boolean {
  const cnpj = valor.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const digito = (base: string, pesos: number[]): number => {
    const soma = pesos.reduce((total, peso, indice) => total + Number(base[indice]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = digito(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return primeiro === Number(cnpj[12]) && segundo === Number(cnpj[13]);
}

export function apenasDigitosCnpj(valor: string): string {
  return valor.replace(/\D/g, '');
}
