import { type FormEvent, useEffect, useState } from 'react';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Campo } from '../../components/Campo';
import { ConfirmarExclusao } from '../../components/ConfirmarExclusao';
import { Icone } from '../../components/Icone';
import { Modal } from '../../components/Modal';
import type { CategoriaDTO } from '../../dtos';
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
  listarCategorias,
  NOME_CATEGORIA_MAXIMO,
} from '../../services/categorias';
import { estiloPeloNome } from '../../utils/cores';
import styles from './Admin.module.css';

function mensagem(e: unknown, padrao: string): string {
  return e instanceof ErroApi ? e.message : padrao;
}

/** CRUD de categorias (área de admin): listar, criar, editar e excluir. */
export function AdminCategorias() {
  const [categorias, setCategorias] = useState<CategoriaDTO[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  /** Formulário aberto: null = fechado; id null = nova categoria. */
  const [editando, setEditando] = useState<{ id: number | null } | null>(null);
  const [nome, setNome] = useState('');
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [excluindo, setExcluindo] = useState<CategoriaDTO | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [apagando, setApagando] = useState(false);

  async function carregar() {
    try {
      setCategorias(await listarCategorias());
    } catch (e) {
      setErroLista(mensagem(e, 'Não foi possível carregar as categorias.'));
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: carrega uma vez ao abrir a aba.
  useEffect(() => {
    carregar();
  }, []);

  function abrirFormulario(categoria?: CategoriaDTO) {
    setNome(categoria?.nome ?? '');
    setErroFormulario(null);
    setEditando({ id: categoria?.id ?? null });
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!editando) return;
    setErroFormulario(null);
    setSalvando(true);
    try {
      if (editando.id === null) await criarCategoria({ nome });
      else await atualizarCategoria(editando.id, { nome });
      setAviso(editando.id === null ? `Categoria "${nome.trim()}" criada.` : 'Categoria atualizada.');
      setEditando(null);
      await carregar();
    } catch (e) {
      setErroFormulario(mensagem(e, 'Não foi possível salvar. Tente de novo.'));
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    setErroExclusao(null);
    setApagando(true);
    try {
      await excluirCategoria(excluindo.id);
      setAviso(`Categoria "${excluindo.nome}" excluída.`);
      setExcluindo(null);
      await carregar();
    } catch (e) {
      setErroExclusao(mensagem(e, 'Não foi possível excluir. Tente de novo.'));
    } finally {
      setApagando(false);
    }
  }

  return (
    <section className={styles.secao} aria-labelledby="titulo-categorias">
      <div className={styles.secaoCabecalho}>
        <h2 id="titulo-categorias" className={styles.secaoTitulo}>
          Categorias {categorias && <span className={styles.contagem}>{categorias.length}</span>}
        </h2>
        <Botao tamanho="sm" larguraTotal={false} icone="mais" onClick={() => abrirFormulario()}>
          Nova categoria
        </Botao>
      </div>

      {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}
      {erroLista && <Aviso tipo="erro">{erroLista}</Aviso>}
      {!categorias && !erroLista && <p className={styles.carregando}>Carregando categorias…</p>}

      {categorias && categorias.length === 0 && <p className={styles.vazio}>Nenhuma categoria cadastrada ainda.</p>}

      {categorias && categorias.length > 0 && (
        <ul className={styles.lista}>
          {categorias.map((categoria) => {
            const estilo = estiloPeloNome(categoria.nome);
            return (
              <li key={categoria.id} className={styles.linha}>
                <span className={styles.selo} style={{ color: estilo?.cor ?? 'var(--cor-secundaria-texto)' }}>
                  <Icone nome={estilo?.icone ?? 'brilho'} tamanho={18} />
                </span>
                <span className={styles.textos}>
                  <span className={styles.nome}>{categoria.nome}</span>
                </span>
                <BotaoIcone
                  icone="editar"
                  rotulo={`Editar ${categoria.nome}`}
                  variante="fantasma"
                  onClick={() => abrirFormulario(categoria)}
                />
                <BotaoIcone
                  icone="lixeira"
                  rotulo={`Excluir ${categoria.nome}`}
                  variante="fantasma"
                  className={styles.botaoExcluir}
                  onClick={() => {
                    setErroExclusao(null);
                    setExcluindo(categoria);
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Modal aberto={editando !== null} aoFechar={() => setEditando(null)} idTitulo="titulo-form-categoria">
        <form className={styles.formulario} onSubmit={salvar} noValidate>
          <h2 id="titulo-form-categoria" className={styles.formularioTitulo}>
            {editando?.id === null ? 'Nova categoria' : 'Editar categoria'}
          </h2>
          <Campo
            rotulo="Nome"
            name="nome"
            maxLength={NOME_CATEGORIA_MAXIMO}
            placeholder="Ex.: Stand-up"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          {erroFormulario && <Aviso tipo="erro">{erroFormulario}</Aviso>}
          <div className={styles.botoes}>
            <Botao variante="secundario" onClick={() => setEditando(null)} disabled={salvando}>
              Cancelar
            </Botao>
            <Botao type="submit" carregando={salvando}>
              Salvar
            </Botao>
          </div>
        </form>
      </Modal>

      <ConfirmarExclusao
        aberto={excluindo !== null}
        titulo={`Excluir "${excluindo?.nome ?? ''}"?`}
        texto="A categoria some dos filtros e do Divulgar. Categorias que ainda têm eventos não podem ser excluídas."
        erro={erroExclusao}
        excluindo={apagando}
        aoConfirmar={confirmarExclusao}
        aoFechar={() => setExcluindo(null)}
      />
    </section>
  );
}
