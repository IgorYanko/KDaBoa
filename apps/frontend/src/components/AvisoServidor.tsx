import { useEffect, useState } from 'react';
import { EVENTO_API_LENTA } from '../api/client';
import styles from './AvisoServidor.module.css';

/**
 * Faixa no topo enquanto a API demora (o servidor gratuito do Render "dorme" e leva até
 * 1 minuto para acordar). Some sozinha quando as respostas chegam.
 */
export function AvisoServidor() {
  const [lenta, setLenta] = useState(false);

  useEffect(() => {
    const aoMudar = (evento: Event) => setLenta((evento as CustomEvent<boolean>).detail);
    window.addEventListener(EVENTO_API_LENTA, aoMudar);
    return () => window.removeEventListener(EVENTO_API_LENTA, aoMudar);
  }, []);

  if (!lenta) return null;
  return (
    <p className={styles.faixa} role="status">
      <span className={styles.indicador} aria-hidden="true" />
      Acordando o servidor… a primeira resposta pode levar até 1 minuto.
    </p>
  );
}
