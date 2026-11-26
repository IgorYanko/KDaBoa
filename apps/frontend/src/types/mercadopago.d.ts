interface DadosCartaoMp {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number | string;
  identificationNumber?: string;
  identificationType?: string;
  cardholderEmail?: string;
}

interface MercadoPagoSdk {
  cardForm: (config: {
    amount: string;
    iframe?: boolean;
    form: {
      id: string;
      cardNumber: { id: string; placeholder?: string };
      expirationDate: { id: string; placeholder?: string };
      securityCode: { id: string; placeholder?: string };
      cardholderName: { id: string; placeholder?: string };
      issuer: { id: string; placeholder?: string };
      installments: { id: string; placeholder?: string };
      identificationType: { id: string; placeholder?: string };
      identificationNumber: { id: string; placeholder?: string };
      cardholderEmail: { id: string; placeholder?: string };
    };
    callbacks: {
      onFormMounted?: (error?: unknown) => void;
      onSubmit?: (event: Event) => void;
    };
  }) => {
    getCardFormData: () => DadosCartaoMp;
    unmount?: () => void;
  };
}

interface MercadoPagoConstrutor {
  new (publicKey: string, options?: { locale?: string }): MercadoPagoSdk;
}

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstrutor;
  }
}

export {};
