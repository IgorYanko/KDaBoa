import { type FormEvent, useEffect, useState } from 'react';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Campo } from '../../components/Campo';
import { ConfirmarExclusao } from '../../components/ConfirmarExclusao';
import { Modal } from '../../components/Modal';
import type { LocalDTO, LocalRequestDTO } from '../../dtos';
import { atualizarLocal, criarLocal, excluirLocal, listarLocais } from '../../services/locais';
import styles from './Admin.module.css';

const VAZIO: LocalRequestDTO = { nome: '', endereco: '', bairro: '', cep: '' };

function mensagem(e: unknown, padrao: string): string {
  return e instanceof ErroApi ? e.message : padrao;
}

/** CRUD de locais (área de admin): listar, criar, editar e excluir. */
export function AdminLocais() {
  const [locais, setLocais] = useState<LocalDTO[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  /** Formulário aberto: null = fechado; id null = novo local. */
  const [editando, setEditando] = useState<{ id: number | null } | null>(null);
  const [formulario, setFormulario] = useState<LocalRequestDTO>(VAZIO);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [excluindo, setExcluindo] = useState<LocalDTO | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [apagando, setApagando] = useState(false);

  async function carregar() {
    try {
      setLocais(await listarLocais());
    } catch (e) {
      setErroLista(mensagem(e, 'Não foi possível carregar os locais.'));
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: carrega uma vez ao abrir a aba.
  useEffect(() => {
    carregar();
  }, []);

  function abrirFormulario(local?: LocalDTO) {
    setFormulario(
      local
        ? { nome: local.nome, endereco: local.endereco, bairro: local.bairro ?? '', cep: local.cep ?? '' }
        : VAZIO,
    );
    setErroFormulario(null);
    setEditando({ id: local?.id ?? null });
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!editando) return;
    setErroFormulario(null);
    setSalvando(true);
    try {
      if (editando.id === null) await criarLocal(formulario);
      else await atualizarLocal(editando.id, formulario);
      setAviso(editando.id === null ? `Local "${formulario.nome.trim()}" criado.` : 'Local atualizado.');
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
      await excluirLocal(excluindo.id);
      setAviso(`Local "${excluindo.nome}" excluído.`);
      setExcluindo(null);
      await carregar();
    } catch (e) {
      setErroExclusao(mensagem(e, 'Não foi possível excluir. Tente de novo.'));
    } finally {
      setApagando(false);
    }
  }

  return (
    <section className={styles.secao} aria-labelledby="titulo-locais">
      <div className={styles.secaoCabecalho}>
        <h2 id="titulo-locais" className={styles.secaoTitulo}>
          Locais {locais && <span className={styles.contagem}>{locais.length}</span>}
        </h2>
        <Botao tamanho="sm" larguraTotal={false} icone="mais" onClick={() => abrirFormulario()}>
          Novo local
        </Botao>
      </div>

      {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}
      {erroLista && <Aviso tipo="erro">{erroLista}</Aviso>}
      {!locais && !erroLista && <p className={styles.carregando}>Carregando locais…</p>}

      {locais && locais.length === 0 && <p className={styles.vazio}>Nenhum local cadastrado ainda.</p>}

      {locais && locais.length > 0 && (
        <ul className={styles.lista}>
          {locais.map((local) => (
            <li key={local.id} className={styles.linha}>
              <span className={styles.textos}>
                <span className={styles.nome}>{local.nome}</span>
                <span className={styles.detalhe}>
                  {local.endereco}
                  {local.bairro && !local.endereco.includes(local.bairro) && ` · ${local.bairro}`}
                </span>
              </span>
              <BotaoIcone icone="editar" rotulo={`Editar ${local.nome}`} variante="fantasma" onClick={() => abrirFormulario(local)} />
              <BotaoIcone
                icone="lixeira"
                rotulo={`Excluir ${local.nome}`}
                variante="fantasma"
                className={styles.botaoExcluir}
                onClick={() => {
                  setErroExclusao(null);
                  setExcluindo(local);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal aberto={editando !== null} aoFechar={() => setEditando(null)} idTitulo="titulo-form-local">
        <form className={styles.formulario} onSubmit={salvar} noValidate>
          <h2 id="titulo-form-local" className={styles.formularioTitulo}>
            {editando?.id === null ? 'Novo local' : 'Editar local'}
          </h2>
          <Campo
            rotulo="Nome"
            name="nome"
            maxLength={120}
            placeholder="Ex.: Teatro Municipal"
            value={formulario.nome}
            onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
          />
          <Campo
            rotulo="Endereço"
            name="endereco"
            maxLength={200}
            placeholder="Rua e número"
            value={formulario.endereco}
            onChange={(e) => setFormulario({ ...formulario, endereco: e.target.value })}
          />
          <div className={styles.duasColunas}>
            <Campo
              rotulo="Bairro (opcional)"
              name="bairro"
              maxLength={80}
              value={formulario.bairro ?? ''}
              onChange={(e) => setFormulario({ ...formulario, bairro: e.target.value })}
            />
            <Campo
              rotulo="CEP (opcional)"
              name="cep"
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              value={formulario.cep ?? ''}
              onChange={(e) => setFormulario({ ...formulario, cep: e.target.value })}
            />
          </div>
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
        texto="O local some da lista do Divulgar. Locais que ainda têm eventos não podem ser excluídos."
        erro={erroExclusao}
        excluindo={apagando}
        aoConfirmar={confirmarExclusao}
        aoFechar={() => setExcluindo(null)}
      />
    </section>
  );
}
