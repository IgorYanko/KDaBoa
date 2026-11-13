import { useState } from 'react';
import iconeOlho from '../assets/icones/olho.svg';
import { Campo, type CampoProps } from './Campo';
import styles from './CampoSenha.module.css';
import { IconeMascara } from './IconeMascara';

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
      <IconeMascara src={iconeOlho} tamanho={20} />
    </button>
  );

  return <Campo {...props} type={visivel ? 'text' : 'password'} acessorio={botao} />;
}
