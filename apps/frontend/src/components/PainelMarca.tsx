import { Icone, type NomeIcone } from './Icone';
import { Marca } from './Marca';
import styles from './PainelMarca.module.css';

const destaques: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: 'calendario', titulo: 'O que rola na cidade', texto: 'Shows, festas, feiras e esporte num lugar só.' },
  { icone: 'pessoas', titulo: 'Veja quem vai', texto: 'Confirme presença e descubra quem mais vai colar.' },
  { icone: 'chat', titulo: 'Combine com a galera', texto: 'Cada evento tem um chat para quem confirmou.' },
];

const categorias: { icone: NomeIcone; nome: string; cor: string }[] = [
  { icone: 'musica', nome: 'Shows', cor: 'var(--cor-categoria-1)' },
  { icone: 'festa', nome: 'Festas', cor: 'var(--cor-categoria-3)' },
  { icone: 'cultura', nome: 'Cultura', cor: 'var(--cor-categoria-2)' },
  { icone: 'gastronomia', nome: 'Gastronomia', cor: 'var(--cor-categoria-4)' },
  { icone: 'esporte', nome: 'Esporte', cor: 'var(--cor-categoria-5)' },
];

/** Painel da marca ao lado do login/cadastro (só no desktop). Decorativo. */
export function PainelMarca() {
  return (
    <aside className={styles.painel} aria-hidden="true">
      <Marca tamanho="lg" />

      <div className={styles.chamada}>
        <p className={styles.sobrancelha}>Pouso Alegre, MG</p>
        <p className={styles.titulo}>
          Descubra o que está rolando e <span className={styles.realce}>veja quem vai.</span>
        </p>
      </div>

      <ul className={styles.categorias}>
        {categorias.map((categoria) => (
          <li key={categoria.nome} style={{ color: categoria.cor }}>
            <Icone nome={categoria.icone} tamanho={16} />
            <span>{categoria.nome}</span>
          </li>
        ))}
      </ul>

      <ul className={styles.destaques}>
        {destaques.map((destaque) => (
          <li key={destaque.titulo} className={styles.destaque}>
            <span className={styles.destaqueIcone}>
              <Icone nome={destaque.icone} />
            </span>
            <span>
              <strong>{destaque.titulo}</strong>
              <span>{destaque.texto}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
