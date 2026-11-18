import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import styles from './BoasVindas.module.css';
import { Botao } from './Botao';
import { Icone, type NomeIcone } from './Icone';
import { Logo } from './Logo';
import { Modal } from './Modal';

const passos: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: 'busca', titulo: 'Descubra', texto: 'Filtre por dia e categoria e ache o rolê certo.' },
  { icone: 'check', titulo: 'Confirme presença', texto: 'Toque em "Eu vou!" e veja quem mais vai.' },
  { icone: 'chat', titulo: 'Combine no chat', texto: 'Cada evento tem um chat só para quem confirmou.' },
];

/** Chave no navegador que marca que essa pessoa já viu as boas-vindas. */
function chave(usuarioId: string): string {
  return `kdaboa:boas-vindas:${usuarioId}`;
}

/**
 * Modal de boas-vindas depois do login. Aparece uma vez por pessoa neste navegador
 * (para ver de novo: apague a chave "kdaboa:boas-vindas:<id>" do localStorage).
 */
export function BoasVindas() {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(() => Boolean(usuario && !localStorage.getItem(chave(usuario.id))));

  function fechar() {
    if (usuario) localStorage.setItem(chave(usuario.id), new Date().toISOString());
    setAberto(false);
  }

  if (!usuario) return null;
  const primeiroNome = usuario.nome.split(' ')[0];

  return (
    <Modal aberto={aberto} aoFechar={fechar} idTitulo="titulo-boas-vindas">
      <div className={styles.topo}>
        <span className={styles.logo}>
          <Logo tamanho={56} />
        </span>
      </div>
      <div className={styles.corpo}>
        <p className={styles.sobrancelha}>Bem-vindo ao KdABoa?</p>
        <h2 id="titulo-boas-vindas" className={styles.titulo}>
          Que bom ter você aqui, <span className={styles.nome}>{primeiroNome}</span>!
        </h2>
        <p className={styles.texto}>Aqui você descobre o que está rolando em Pouso Alegre e combina com a galera.</p>

        <ol className={styles.passos}>
          {passos.map((passo) => (
            <li key={passo.titulo} className={styles.passo}>
              <span className={styles.passoIcone}>
                <Icone nome={passo.icone} />
              </span>
              <span>
                <strong>{passo.titulo}</strong>
                <span>{passo.texto}</span>
              </span>
            </li>
          ))}
        </ol>

        <Botao onClick={fechar}>Bora!</Botao>
      </div>
    </Modal>
  );
}
