import { useState } from 'react';
import { Link } from 'react-router';
import { classesBotao } from '../../components/Botao';
import { Icone } from '../../components/Icone';
import { Segmentos } from '../../components/Segmentos';
import { useAuth } from '../../contexts/useAuth';
import { ehAdmin } from '../../utils/permissoes';
import styles from './Admin.module.css';
import { AdminCategorias } from './AdminCategorias';
import { AdminLocais } from './AdminLocais';

type Aba = 'locais' | 'categorias';

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: 'locais', rotulo: 'Locais' },
  { valor: 'categorias', rotulo: 'Categorias' },
];

/**
 * Área de admin: CRUD de locais e de categorias. Só para o perfil ADMIN;
 * o backend confere a mesma regra em cada rota.
 */
export function Admin() {
  const { usuario } = useAuth();
  const [aba, setAba] = useState<Aba>('locais');

  if (!ehAdmin(usuario)) {
    return (
      <main className={styles.tela}>
        <div className={styles.restrito}>
          <span className={styles.restritoIcone}>
            <Icone nome="cadeado" tamanho={24} />
          </span>
          <h1 className={styles.titulo}>Área só para administradores</h1>
          <p className={styles.subtitulo}>Sua conta não tem acesso a esta página.</p>
          <Link to="/inicio" className={classesBotao({ larguraTotal: false })}>
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <p className={styles.sobrancelha}>
          <Icone nome="cadeado" tamanho={14} />
          Administração
        </p>
        <h1 className={styles.titulo}>Cadastros do app</h1>
        <p className={styles.subtitulo}>Locais e categorias que aparecem no Divulgar e nos filtros do Início.</p>
      </header>

      <Segmentos rotulo="Cadastro" opcoes={ABAS} selecionado={aba} onMudar={(valor) => valor && setAba(valor)} />

      {aba === 'locais' ? <AdminLocais /> : <AdminCategorias />}
    </main>
  );
}
