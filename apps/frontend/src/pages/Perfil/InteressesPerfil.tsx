import { type CSSProperties, useState } from 'react';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Chip } from '../../components/Chip';
import { Icone } from '../../components/Icone';
import type { CategoriaDTO } from '../../dtos';
import { estiloPeloNome } from '../../utils/cores';
import styles from './Perfil.module.css';

interface Props {
  categorias: CategoriaDTO[];
  /** Ids escolhidos (como estão salvos). */
  selecionados: number[];
  /** Grava a nova lista; rejeita com a mensagem de erro da API. */
  onSalvar: (interesses: number[]) => Promise<void>;
}

/** Seção "Interesses" do Perfil: mostra os escolhidos e, em "Editar", deixa trocar. */
export function InteressesPerfil({ categorias, selecionados, onSalvar }: Props) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<number[]>(selecionados);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const escolhidas = categorias.filter((c) => selecionados.includes(c.id));

  function comecarEdicao() {
    setRascunho(selecionados);
    setErro(null);
    setEditando(true);
  }

  function alternar(id: number) {
    setErro(null);
    setRascunho((atual) => (atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id]));
  }

  async function salvar() {
    if (rascunho.length === 0) {
      setErro('Escolha pelo menos um interesse.');
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(rascunho);
      setEditando(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className={styles.secao} aria-labelledby="titulo-interesses">
      <div className={styles.secaoCabecalho}>
        <h2 id="titulo-interesses" className={styles.secaoTitulo}>
          Interesses
        </h2>
        {!editando && (
          <button type="button" className={styles.editar} onClick={comecarEdicao}>
            <Icone nome="editar" tamanho={16} />
            Editar
          </button>
        )}
      </div>

      {editando ? (
        <>
          <fieldset className={styles.chips}>
            <legend className={styles.somenteLeitor}>Escolha seus interesses</legend>
            {categorias.map((categoria) => (
              <Chip
                key={categoria.id}
                rotulo={categoria.nome}
                selecionado={rascunho.includes(categoria.id)}
                onAlternar={() => alternar(categoria.id)}
              />
            ))}
          </fieldset>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <div className={styles.acoesEdicao}>
            <Botao variante="secundario" tamanho="sm" onClick={() => setEditando(false)} disabled={salvando}>
              Cancelar
            </Botao>
            <Botao tamanho="sm" carregando={salvando} onClick={salvar}>
              Salvar
            </Botao>
          </div>
        </>
      ) : escolhidas.length > 0 ? (
        <ul className={styles.chips}>
          {escolhidas.map((categoria) => {
            const estilo = estiloPeloNome(categoria.nome);
            return (
              <li
                key={categoria.id}
                className={styles.etiqueta}
                style={{ '--cor-etiqueta': estilo?.cor ?? 'var(--cor-secundaria)' } as CSSProperties}
              >
                {estilo && <Icone nome={estilo.icone} tamanho={16} />}
                {categoria.nome}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.semInteresses}>Nenhum interesse escolhido ainda.</p>
      )}
    </section>
  );
}
