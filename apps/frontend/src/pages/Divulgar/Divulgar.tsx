import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/client';
import { AreaTexto } from '../../components/AreaTexto';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Campo } from '../../components/Campo';
import { CampoImagem } from '../../components/CampoImagem';
import { CampoSelecao } from '../../components/CampoSelecao';
import { Chip } from '../../components/Chip';
import { EventoCard } from '../../components/EventoCard';
import { Icone } from '../../components/Icone';
import { Interruptor } from '../../components/Interruptor';
import { Segmentos } from '../../components/Segmentos';
import { useAuth } from '../../contexts/useAuth';
import type { CategoriaDTO, LocalDTO } from '../../dtos';
import { listarCategorias } from '../../services/categorias';
import { atualizarEvento, buscarEvento, criarEvento, type EventoCompleto } from '../../services/eventos';
import { listarLocais } from '../../services/locais';
import { podeGerenciarEvento } from '../../utils/permissoes';
import styles from './Divulgar.module.css';
import { NovoLocal } from './NovoLocal';
import {
  DESCRICAO_MAXIMA,
  dataInicioIso,
  enderecoDoFormulario,
  type ErrosEvento,
  FORMULARIO_INICIAL,
  type FormularioEvento,
  formularioDoEvento,
  hojeIso,
  lerPreco,
  paraRequisicao,
  TITULO_MAXIMO,
  validarEvento,
} from './validarEvento';

const MODOS_LOCAL: { valor: FormularioEvento['modoLocal']; rotulo: string }[] = [
  { valor: 'lista', rotulo: 'Local cadastrado' },
  { valor: 'novo', rotulo: 'Novo local' },
];

const CLASSIFICACOES = [
  { valor: '0', rotulo: 'Livre' },
  { valor: '10', rotulo: '10 anos' },
  { valor: '12', rotulo: '12 anos' },
  { valor: '14', rotulo: '14 anos' },
  { valor: '16', rotulo: '16 anos' },
  { valor: '18', rotulo: '18 anos' },
];

/**
 * Tela · Divulgar evento (issues #43 a #46). Em /eventos/:id/editar, a mesma tela edita
 * um evento existente (só para quem criou ou um ADMIN).
 */
export function Divulgar() {
  const navegar = useNavigate();
  const local = useLocation();
  const { id } = useParams();
  const { usuario } = useAuth();
  const editando = Boolean(id);
  const organizador = usuario?.perfil === 'ORGANIZADOR';
  /** Edição: o evento ainda está carregando, ou a pessoa não pode editar. */
  const [prontoParaEditar, setProntoParaEditar] = useState(!editando);
  const [capaAtual, setCapaAtual] = useState<string | null>(null);

  const [formulario, setFormulario] = useState<FormularioEvento>(FORMULARIO_INICIAL);
  const [capa, setCapa] = useState<File | null>(null);
  const [previaCapa, setPreviaCapa] = useState<string | null>(null);
  const [erros, setErros] = useState<ErrosEvento>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [locais, setLocais] = useState<LocalDTO[]>([]);

  useEffect(() => {
    Promise.all([listarCategorias(), listarLocais()])
      .then(([listaCategorias, listaLocais]) => {
        setCategorias(listaCategorias);
        setLocais(listaLocais);
      })
      .catch(() => setErroApi('Não foi possível carregar as categorias e os locais.'));
  }, []);

  // Edição: preenche o formulário com o evento (se a pessoa puder editar).
  useEffect(() => {
    if (!id) return;
    let ativo = true;
    buscarEvento(id)
      .then(({ evento }) => {
        if (!ativo) return;
        if (!podeGerenciarEvento(evento, usuario)) {
          setErroApi('Só quem criou o evento ou um administrador pode editar.');
          return;
        }
        setFormulario(formularioDoEvento(evento));
        setCapaAtual(evento.capa_url ?? null);
        setProntoParaEditar(true);
      })
      .catch((e) => {
        if (ativo) setErroApi(e instanceof ErroApi ? e.message : 'Não foi possível carregar o evento.');
      });
    return () => {
      ativo = false;
    };
  }, [id, usuario]);

  // Imagem da prévia do card (desktop).
  useEffect(() => {
    if (!capa) {
      setPreviaCapa(null);
      return;
    }
    const url = URL.createObjectURL(capa);
    setPreviaCapa(url);
    return () => URL.revokeObjectURL(url);
  }, [capa]);

  function alterar<K extends keyof FormularioEvento>(campo: K, valor: FormularioEvento[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function marcarErro(campo: keyof FormularioEvento, mensagem: string) {
    setErros((atual) => ({ ...atual, [campo]: mensagem }));
  }

  function fechar() {
    if (local.key === 'default') navegar('/inicio');
    else navegar(-1);
  }

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroApi(null);
    const encontrados = validarEvento(formulario, new Date(), organizador && !editando);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      // Leva até o primeiro campo com problema.
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setEnviando(true);
    try {
      const corpo = paraRequisicao(formulario);
      // Venda no app: só conta CNPJ, e só ao publicar (a edição não muda a venda).
      if (!organizador || id) {
        corpo.venda_no_app = undefined;
        corpo.quantidade_ingressos = undefined;
      }
      if (id) {
        await atualizarEvento(id, corpo, capa);
        navegar(`/eventos/${id}`, { replace: true, state: { editado: true } });
        return;
      }
      const novo = await criarEvento(corpo, capa);
      navegar(`/eventos/${novo.id}`, { replace: true, state: { publicado: true } });
    } catch (e) {
      setErroApi(e instanceof ErroApi ? e.message : 'Não foi possível salvar. Tente de novo.');
      setEnviando(false);
    }
  }

  // Card de prévia montado com o que já foi digitado.
  const amanha = new Date(Date.now() + 86_400_000).toISOString();
  const previa: EventoCompleto = {
    evento: {
      id: 'previa',
      titulo: formulario.titulo.trim() || 'Nome do evento',
      descricao: formulario.descricao,
      data_inicio: dataInicioIso(formulario) ?? amanha,
      preco: lerPreco(formulario.preco) ?? 0,
      classificacao_etaria: Number(formulario.classificacao),
      categoria_id: formulario.categoriaId ?? 0,
      local_id: Number(formulario.localId),
      criador_id: '',
      capa_url: previaCapa ?? capaAtual,
      total_confirmados: 0,
      participantes_amostra: [],
    },
    categoria: categorias.find((c) => c.id === formulario.categoriaId),
    local:
      formulario.modoLocal === 'novo'
        ? {
            id: 0,
            nome: formulario.novoLocalNome.trim() || 'Novo local',
            endereco: formulario.cidade ? enderecoDoFormulario(formulario) : '',
            capacidade: 0,
          }
        : locais.find((l) => String(l.id) === formulario.localId),
  };

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <BotaoIcone icone="fechar" rotulo="Fechar" onClick={fechar} />
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>{editando ? 'Editar evento' : 'Divulgar evento'}</h1>
          <p className={styles.subtitulo}>
            {editando
              ? 'Ajuste o que mudou; quem vai vê na hora.'
              : organizador
                ? 'Evento verificado da sua empresa.'
                : 'Conte para a galera o que vai rolar.'}
          </p>
        </div>
      </header>

      <div className={styles.grade}>
        <form className={styles.formulario} onSubmit={publicar} noValidate>
          {erroApi && <Aviso tipo="erro">{erroApi}</Aviso>}

          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>
              <span className={styles.numero}>1</span> Capa
            </h2>
            <CampoImagem rotulo="Imagem de capa (opcional)" arquivo={capa} aoMudar={setCapa} />
          </section>

          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>
              <span className={styles.numero}>2</span> Sobre o evento
            </h2>
            <Campo
              rotulo="Nome do evento"
              name="titulo"
              placeholder="Ex.: Noite de rock autoral"
              maxLength={TITULO_MAXIMO}
              value={formulario.titulo}
              erro={erros.titulo}
              onChange={(e) => alterar('titulo', e.target.value)}
            />
            <AreaTexto
              rotulo="Descrição"
              name="descricao"
              placeholder="O que vai ter, que horas começa, o que levar…"
              maxLength={DESCRICAO_MAXIMA}
              value={formulario.descricao}
              erro={erros.descricao}
              onChange={(e) => alterar('descricao', e.target.value)}
            />
            <fieldset className={styles.categorias} aria-describedby={erros.categoriaId ? 'erro-categoria' : undefined}>
              <legend className={styles.legenda}>Categoria</legend>
              <div className={styles.chips}>
                {categorias.map((categoria) => (
                  <Chip
                    key={categoria.id}
                    rotulo={categoria.nome}
                    selecionado={formulario.categoriaId === categoria.id}
                    onAlternar={() => alterar('categoriaId', categoria.id)}
                  />
                ))}
              </div>
              {erros.categoriaId && (
                <p id="erro-categoria" className={styles.erro}>
                  <Icone nome="alerta" tamanho={14} />
                  {erros.categoriaId}
                </p>
              )}
            </fieldset>
          </section>

          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>
              <span className={styles.numero}>3</span> Quando e onde
            </h2>
            <div className={styles.duasColunas}>
              <Campo
                rotulo="Data"
                type="date"
                name="data"
                min={hojeIso()}
                value={formulario.data}
                erro={erros.data}
                onChange={(e) => alterar('data', e.target.value)}
              />
              <Campo
                rotulo="Horário"
                type="time"
                name="horario"
                value={formulario.horario}
                erro={erros.horario}
                onChange={(e) => alterar('horario', e.target.value)}
              />
            </div>
            {/* Novo local pelo CEP só ao publicar: a edição troca o local escolhendo da lista. */}
            {!editando && (
              <Segmentos
                rotulo="Onde vai ser"
                opcoes={MODOS_LOCAL}
                selecionado={formulario.modoLocal}
                onMudar={(modo) => modo && alterar('modoLocal', modo)}
              />
            )}
            {formulario.modoLocal === 'lista' ? (
              <CampoSelecao
                rotulo="Local"
                name="local"
                marcador="Escolha o local"
                opcoes={locais.map((l) => ({ valor: String(l.id), rotulo: `${l.nome} — ${l.endereco}` }))}
                value={formulario.localId}
                erro={erros.localId}
                onChange={(e) => alterar('localId', e.target.value)}
              />
            ) : (
              <NovoLocal formulario={formulario} erros={erros} alterar={alterar} marcarErro={marcarErro} />
            )}
          </section>

          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>
              <span className={styles.numero}>4</span> Ingresso
            </h2>
            <div className={styles.duasColunas}>
              <Campo
                rotulo="Preço (R$)"
                name="preco"
                inputMode="decimal"
                icone="ingresso"
                placeholder="Gratuito"
                value={formulario.preco}
                erro={erros.preco}
                onChange={(e) => alterar('preco', e.target.value)}
              />
              <CampoSelecao
                rotulo="Classificação"
                name="classificacao"
                opcoes={CLASSIFICACOES}
                value={formulario.classificacao}
                onChange={(e) => alterar('classificacao', e.target.value)}
              />
            </div>
            {organizador && !editando && (
              <>
                <Interruptor
                  titulo="Vender ingresso no app"
                  descricao="Desligado, o preço fica só na portaria."
                  ligado={formulario.vendaNoApp}
                  onAlternar={(ligado) => alterar('vendaNoApp', ligado)}
                />
                {formulario.vendaNoApp && (
                  <Campo
                    rotulo="Quantidade de ingressos"
                    name="quantidade"
                    inputMode="numeric"
                    placeholder="Ex.: 100"
                    value={formulario.quantidade}
                    erro={erros.quantidade}
                    onChange={(e) => alterar('quantidade', e.target.value.replace(/\D/g, ''))}
                  />
                )}
              </>
            )}
          </section>

          <Botao
            type="submit"
            carregando={enviando}
            disabled={!prontoParaEditar}
            icone={editando ? 'check' : 'brilho'}
            className={styles.publicar}
          >
            {editando ? 'Salvar alterações' : 'Publicar evento'}
          </Botao>
        </form>

        {/* Prévia (só no desktop): não é clicável. */}
        <aside className={styles.lateral} aria-label="Prévia do card">
          <p className={styles.sobrancelha}>Prévia</p>
          <div inert>
            <EventoCard item={previa} />
          </div>
          <p className={styles.dica}>
            <Icone nome="brilho" tamanho={14} />É assim que o evento aparece no Início.
          </p>
        </aside>
      </div>
    </main>
  );
}
