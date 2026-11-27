import { useCallback, useEffect, useRef, useState } from 'react';
import type { Coordenadas } from '../../utils/geo';

/**
 * parada = ainda não pediu · procurando = esperando o GPS · ativa = posição ao vivo
 * · negada = a pessoa bloqueou · indisponivel = aparelho sem GPS ou página sem HTTPS.
 */
export type EstadoLocalizacao = 'parada' | 'procurando' | 'ativa' | 'negada' | 'indisponivel';

/**
 * Posição ao vivo da pessoa (geolocalização do navegador).
 * Só pede permissão quando `iniciar` é chamado; se a permissão já foi dada antes, começa sozinho.
 */
export function useLocalizacao() {
  const [estado, setEstado] = useState<EstadoLocalizacao>('parada');
  const [posicao, setPosicao] = useState<Coordenadas | null>(null);
  const vigia = useRef<number | null>(null);

  const parar = useCallback(() => {
    if (vigia.current !== null) navigator.geolocation.clearWatch(vigia.current);
    vigia.current = null;
  }, []);

  const iniciar = useCallback(() => {
    // O navegador só libera a localização em HTTPS (ou localhost).
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setEstado('indisponivel');
      return;
    }
    if (vigia.current !== null) return;
    setEstado('procurando');
    vigia.current = navigator.geolocation.watchPosition(
      (p) => {
        setPosicao([p.coords.latitude, p.coords.longitude]);
        setEstado('ativa');
      },
      (erro) => {
        setEstado(erro.code === erro.PERMISSION_DENIED ? 'negada' : 'indisponivel');
        parar();
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
  }, [parar]);

  useEffect(() => {
    let ativo = true;
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((status) => {
        if (ativo && status.state === 'granted') iniciar();
      })
      .catch(() => {});
    return () => {
      ativo = false;
      parar();
    };
  }, [iniciar, parar]);

  return { estado, posicao, iniciar };
}
