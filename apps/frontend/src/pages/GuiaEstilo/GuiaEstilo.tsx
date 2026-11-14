import type { CSSProperties } from 'react';
import { Icone, nomesIcones } from '../../components/Icone';
import styles from './GuiaEstilo.module.css';

interface Amostra {
  nome: string;
  variavel: string;
  uso: string;
}

const grupos: { titulo: string; amostras: Amostra[] }[] = [
  {
    titulo: 'Marca e apoio',
    amostras: [
      { nome: 'Limão', variavel: '--cor-primaria', uso: 'Ação principal, marca' },
      { nome: 'Limão tinta', variavel: '--cor-primaria-tinta', uso: 'Fundo de seleção' },
      { nome: 'Ultravioleta', variavel: '--cor-secundaria', uso: 'Foco, seleção, interruptor' },
      { nome: 'Ultravioleta texto', variavel: '--cor-secundaria-texto', uso: 'Links e detalhes' },
      { nome: 'Ultravioleta tinta', variavel: '--cor-secundaria-tinta', uso: 'Fundo de destaque' },
    ],
  },
  {
    titulo: 'Superfícies',
    amostras: [
      { nome: 'Fundo', variavel: '--cor-fundo', uso: 'Fundo das telas' },
      { nome: 'Superfície', variavel: '--cor-superficie', uso: 'Cards' },
      { nome: 'Elevada', variavel: '--cor-superficie-elevada', uso: 'Hover, ícones' },
      { nome: 'Alta', variavel: '--cor-superficie-alta', uso: 'Modal, menus' },
      { nome: 'Campo', variavel: '--cor-campo', uso: 'Inputs' },
      { nome: 'Borda', variavel: '--cor-borda', uso: 'Stroke dos cards' },
    ],
  },
  {
    titulo: 'Texto',
    amostras: [
      { nome: 'Texto', variavel: '--cor-texto', uso: 'Títulos e texto' },
      { nome: 'Rótulo', variavel: '--cor-rotulo', uso: 'Rótulos de campo' },
      { nome: 'Suave', variavel: '--cor-texto-suave', uso: 'Apoio' },
      { nome: 'Fraco', variavel: '--cor-texto-fraco', uso: 'Placeholder' },
    ],
  },
  {
    titulo: 'Categorias',
    amostras: [
      { nome: 'Shows', variavel: '--cor-categoria-1', uso: 'Acento' },
      { nome: 'Cultura / Teatro', variavel: '--cor-categoria-2', uso: 'Acento' },
      { nome: 'Festas', variavel: '--cor-categoria-3', uso: 'Acento' },
      { nome: 'Gastronomia', variavel: '--cor-categoria-4', uso: 'Acento' },
      { nome: 'Esporte', variavel: '--cor-categoria-5', uso: 'Acento' },
      { nome: 'Erro', variavel: '--cor-erro', uso: 'Mensagens de erro' },
    ],
  },
];

const escala = [
  { variavel: '--texto-4xl', exemplo: 'Bora sair?', titulo: true },
  { variavel: '--texto-3xl', exemplo: 'Noite de rock autoral', titulo: true },
  { variavel: '--texto-2xl', exemplo: 'Próximos eventos', titulo: true },
  { variavel: '--texto-xl', exemplo: 'Sarau na praça', titulo: true },
  { variavel: '--texto-lg', exemplo: 'Feira gastronômica', titulo: false },
  { variavel: '--texto-base', exemplo: 'Descubra o que está rolando em Pouso Alegre e veja quem vai.', titulo: false },
  { variavel: '--texto-sm', exemplo: 'Sáb · 18h · Praça Central', titulo: false },
  { variavel: '--texto-xs', exemplo: '41 pessoas vão', titulo: false },
];

const raios = ['--raio-xs', '--raio-sm', '--raio-md', '--raio-lg', '--raio-xl', '--raio-pilula'];
const sombras = ['--sombra-1', '--sombra-2', '--sombra-3', '--brilho-primaria', '--brilho-secundaria'];

/** Guia de estilo (só no modo desenvolvimento): mostra os tokens de styles/tokens.css. */
export function GuiaEstilo() {
  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <p className={styles.sobrancelha}>Guia de estilo</p>
        <h1 className={styles.titulo}>KdABoa — base visual</h1>
        <p className={styles.texto}>
          Tokens de <code>src/styles/tokens.css</code>. Esta página só existe no <code>pnpm dev</code>.
        </p>
      </header>

      {grupos.map((grupo) => (
        <section key={grupo.titulo} className={styles.secao}>
          <h2 className={styles.secaoTitulo}>{grupo.titulo}</h2>
          <ul className={styles.cores}>
            {grupo.amostras.map((amostra) => (
              <li key={amostra.variavel} className={styles.cor}>
                <span className={styles.corAmostra} style={{ background: `var(${amostra.variavel})` }} />
                <span className={styles.corNome}>{amostra.nome}</span>
                <code className={styles.corVariavel}>{amostra.variavel}</code>
                <span className={styles.corUso}>{amostra.uso}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Gradiente e ambiente</h2>
        <div className={styles.gradientes}>
          <div className={styles.gradiente} style={{ background: 'var(--gradiente-marca)' }}>
            <code>--gradiente-marca</code>
          </div>
          <div className={`${styles.gradiente} ${styles.ambiente}`}>
            <code>--gradiente-ambiente</code>
          </div>
        </div>
      </section>

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Tipografia</h2>
        <p className={styles.texto}>Space Grotesk nos títulos, Inter no texto.</p>
        <ul className={styles.escala}>
          {escala.map((item) => (
            <li key={item.variavel} className={styles.escalaItem}>
              <code className={styles.corVariavel}>{item.variavel}</code>
              <span
                className={item.titulo ? styles.escalaTitulo : undefined}
                style={{ fontSize: `var(${item.variavel})` } as CSSProperties}
              >
                {item.exemplo}
              </span>
            </li>
          ))}
          <li className={styles.escalaItem}>
            <code className={styles.corVariavel}>sobrancelha</code>
            <span className={styles.sobrancelha}>Próximos eventos · 5</span>
          </li>
        </ul>
      </section>

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Raios e sombras</h2>
        <div className={styles.caixas}>
          {raios.map((raio) => (
            <div key={raio} className={styles.caixa} style={{ borderRadius: `var(${raio})` }}>
              <code>{raio}</code>
            </div>
          ))}
        </div>
        <div className={styles.caixas}>
          {sombras.map((sombra) => (
            <div key={sombra} className={styles.caixa} style={{ boxShadow: `var(${sombra})` }}>
              <code>{sombra}</code>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Ícones</h2>
        <ul className={styles.icones}>
          {nomesIcones.map((nome) => (
            <li key={nome} className={styles.icone}>
              <Icone nome={nome} tamanho={24} />
              <span>{nome}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
