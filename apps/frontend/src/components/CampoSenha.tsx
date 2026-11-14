import { useState } from 'react';
import { Campo, type CampoProps } from './Campo';
import styles from './CampoSenha.module.css';
import { Icone } from './Icone';

/** Campo de senha com o botão de mostrar/ocultar (olho). */
export function CampoSenha(props: Omit<CampoProps, 'type' | 'acessorio'>) {
  const [visivel, setVisivel] = useState(false);

  const botao = (
    <button
      type="button"
      className={visivel ? `${styles.olho} ${styles.ativo}` : styles.olho}
      onClick={() => setVisivel((v) => !v)}
      aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
      aria-pressed={visivel}
    >
      <Icone nome={visivel ? 'olho-fechado' : 'olho'} />
    </button>
  );

  return <Campo {...props} type={visivel ? 'text' : 'password'} acessorio={botao} />;
}
