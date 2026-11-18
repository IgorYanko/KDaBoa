import { useEffect, useState } from 'react';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Campo } from '../../components/Campo';
import { CampoBusca } from '../../components/CampoBusca';
import { CampoSenha } from '../../components/CampoSenha';
import { Chip } from '../../components/Chip';
import { EventoCard } from '../../components/EventoCard';
import { Interruptor } from '../../components/Interruptor';
import { Segmentos } from '../../components/Segmentos';
import { type EventoCompleto, listarEventos } from '../../services/eventos';
import styles from './GuiaEstilo.module.css';

const CATEGORIAS = ['Shows', 'Festas', 'Cultura', 'Esporte', 'Gastronomia', 'Teatro'];

/** Componentes de src/components com seus estados, para revisar o visual sem navegar pelo app. */
export function SecaoComponentes() {
  const [selecionadas, setSelecionadas] = useState<string[]>(['Festas', 'Cultura']);
  const [presenca, setPresenca] = useState(true);
  const [lembretes, setLembretes] = useState(false);
  const [periodo, setPeriodo] = useState<'hoje' | 'fds' | 'mes' | null>('fds');
  const [eventos, setEventos] = useState<EventoCompleto[]>([]);

  useEffect(() => {
    listarEventos().then((lista) => setEventos(lista.slice(0, 3)));
  }, []);

  function alternar(nome: string) {
    setSelecionadas((atual) => (atual.includes(nome) ? atual.filter((n) => n !== nome) : [...atual, nome]));
  }

  return (
    <section className={styles.secao}>
      <h2 className={styles.secaoTitulo}>Componentes</h2>

      <div className={styles.componentes}>
        <div className={styles.componente}>
          <p className={styles.sobrancelha}>Botões</p>
          <Botao>Entrar</Botao>
          <Botao variante="secundario" icone="compartilhar">
            Compartilhar
          </Botao>
          <Botao variante="fantasma" icone="mapa">
            Ver no mapa
          </Botao>
          <Botao carregando>Entrar</Botao>
          <div className={styles.linha}>
            <Botao tamanho="sm" larguraTotal={false} icone="mais">
              Divulgar
            </Botao>
            <Botao tamanho="sm" variante="secundario" larguraTotal={false}>
              Cancelar
            </Botao>
          </div>
          <div className={styles.linha}>
            <BotaoIcone icone="voltar" rotulo="Voltar" />
            <BotaoIcone icone="compartilhar" rotulo="Compartilhar" variante="contorno" />
            <BotaoIcone icone="mais" rotulo="Divulgar" variante="fantasma" />
            <span className={styles.fundoColorido}>
              <BotaoIcone icone="voltar" rotulo="Voltar" variante="vidro" />
              <BotaoIcone icone="compartilhar" rotulo="Compartilhar" variante="vidro" />
            </span>
          </div>
        </div>

        <div className={styles.componente}>
          <p className={styles.sobrancelha}>Campos</p>
          <Campo rotulo="E-mail" type="email" placeholder="voce@email.com" />
          <CampoSenha rotulo="Senha" placeholder="Sua senha" />
          <Campo rotulo="Nome do evento" icone="brilho" placeholder="Ex.: Noite de rock autoral" />
          <Campo rotulo="E-mail" type="email" defaultValue="kayo@" erro="Digite um e-mail válido." />
          <CampoBusca rotulo="Buscar eventos" placeholder="Buscar shows, festas, lugares…" />
          <Segmentos
            rotulo="Quando"
            opcoes={[
              { valor: 'hoje', rotulo: 'Hoje' },
              { valor: 'fds', rotulo: 'Fim de semana' },
              { valor: 'mes', rotulo: 'Este mês' },
            ]}
            selecionado={periodo}
            onMudar={setPeriodo}
          />
        </div>

        <div className={styles.componente}>
          <p className={styles.sobrancelha}>Categorias e interruptores</p>
          <div className={styles.chips}>
            {CATEGORIAS.map((nome) => (
              <Chip key={nome} rotulo={nome} selecionado={selecionadas.includes(nome)} onAlternar={() => alternar(nome)} />
            ))}
          </div>
          <Interruptor
            titulo="Mostrar minha presença"
            descricao="Outras pessoas veem quando você confirma um evento."
            ligado={presenca}
            onAlternar={setPresenca}
          />
          <Interruptor
            titulo="Lembretes de eventos"
            descricao="Aviso no dia dos eventos confirmados."
            ligado={lembretes}
            onAlternar={setLembretes}
          />
          <Aviso tipo="sucesso">Conta criada! Agora é só entrar.</Aviso>
          <Aviso tipo="erro">E-mail ou senha incorretos.</Aviso>
        </div>
      </div>

      <p className={styles.sobrancelha}>Card de evento</p>
      <ul className={styles.cards}>
        {eventos.map((item) => (
          <li key={item.evento.id}>
            <EventoCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
