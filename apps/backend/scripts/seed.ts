import bcrypt from 'bcrypt';
import type { Perfil } from '../src/generated/prisma/client';
import { prisma } from '../src/prisma';

const SENHA_DEMO = 'kdaboa123';

const usuarios: {
  nome: string;
  email: string;
  perfil: Perfil;
  interesses: string[];
  cnpj?: string;
  nomeFantasia?: string;
}[] = [
  { nome: 'Admin KdABoa', email: 'admin@kdaboa.com', perfil: 'ADMIN', interesses: ['Shows', 'Cultura'] },
  {
    nome: 'Organizador Teste',
    email: 'organizador@kdaboa.com',
    perfil: 'ORGANIZADOR',
    interesses: ['Festas'],
    cnpj: '11222333000181',
    nomeFantasia: 'Produtora Teste',
  },
  { nome: 'Usuário Teste', email: 'usuario@kdaboa.com', perfil: 'USUARIO', interesses: ['Festas', 'Gastronomia'] },
  { nome: 'Ana Souza', email: 'ana@kdaboa.com', perfil: 'USUARIO', interesses: ['Shows', 'Teatro'] },
  { nome: 'Bruno Lima', email: 'bruno@kdaboa.com', perfil: 'USUARIO', interesses: ['Esporte', 'Festas'] },
];

const locaisExtras = [
  {
    nome: 'Área de Eventos da Festa de Peão',
    endereco: 'MG-290, sentido Borda da Mata, próximo ao Posto do Macaco',
    bairro: 'São João',
    latitude: -22.239431,
    longitude: -45.958675,
  },
  {
    nome: 'Catedral Metropolitana Senhor Bom Jesus',
    endereco: 'Praça Senador José Bento, s/n',
    bairro: 'Centro',
    cep: '37550-035',
    latitude: -22.23038,
    longitude: -45.93658,
  },
  {
    nome: 'Praça João Pinheiro',
    endereco: 'Praça João Pinheiro, s/n',
    bairro: 'Centro',
    cep: '37550-191',
    latitude: -22.233876,
    longitude: -45.939586,
  },
  {
    nome: 'Mercado Municipal',
    endereco: 'Rua Comendador José Garcia, s/n',
    bairro: 'Centro',
    latitude: -22.231700,
    longitude: -45.934700,
  },
  {
    nome: 'Univás - Unidade Fátima',
    endereco: 'Av. Prefeito Tuany Toledo, 470',
    bairro: 'Fátima',
    latitude: -22.244600,
    longitude: -45.924500,
  },
  {
    nome: 'Estádio Manduzão',
    endereco: 'Av. Prefeito Olavo Gomes de Oliveira, s/n',
    bairro: 'São Geraldo',
    latitude: -22.239800,
    longitude: -45.918300,
  },
  {
    nome: 'Teatro Municipal',
    endereco: 'Rua Adalberto Ferraz, s/n',
    bairro: 'Centro',
    latitude: -22.229000,
    longitude: -45.937500,
  },
  {
    nome: 'Shopping Serra Sul',
    endereco: 'Av. Vereador Antônio da Costa Rios, 1950',
    bairro: 'São Geraldo',
    latitude: -22.252500,
    longitude: -45.942000,
  },
];

const eventos = [
  {
    titulo: 'Feira do Produtor no Mercado',
    descricao: 'Queijo, café, doce de leite e verdura fresca direto de quem produz.',
    diasAFrente: 0,
    hora: 8,
    duracaoHoras: 5,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Gastronomia',
    local: 'Mercado Municipal',
    criador: 'usuario@kdaboa.com',
    presencas: ['ana@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Pelada solidária no Manduzão',
    descricao: 'Futebol aberto pra quem chegar. A inscrição vira cesta básica.',
    diasAFrente: 0,
    hora: 0,
    agora: true,
    duracaoHoras: 4,
    preco: 5,
    classificacaoEtaria: 0,
    categoria: 'Esporte',
    local: 'Estádio Manduzão',
    criador: 'admin@kdaboa.com',
    presencas: ['bruno@kdaboa.com', 'usuario@kdaboa.com'],
    mensagens: [{ autor: 'bruno@kdaboa.com', conteudo: 'Já tem dois times, chega mais!' }],
  },
  {
    titulo: 'Happy hour da Univás',
    descricao: 'Fim de aula com música, petisco e o pessoal da faculdade.',
    diasAFrente: 0,
    hora: 17,
    duracaoHoras: 4,
    preco: 10,
    classificacaoEtaria: 18,
    categoria: 'Festas',
    local: 'Univás - Unidade Fátima',
    criador: 'organizador@kdaboa.com',
    presencas: ['usuario@kdaboa.com', 'bruno@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Esquenta sertanejo no Bar do Centro',
    descricao: 'Voz e violão com os sucessos que vão tocar na Festa do Peão.',
    diasAFrente: 0,
    hora: 18,
    duracaoHoras: 4,
    preco: 15,
    classificacaoEtaria: 18,
    categoria: 'Shows',
    local: 'Bar do Centro',
    criador: 'organizador@kdaboa.com',
    presencas: ['ana@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Food trucks no Serra Sul',
    descricao: 'Hambúrguer, pastel e churros no estacionamento do shopping.',
    diasAFrente: 0,
    hora: 18,
    duracaoHoras: 4,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Gastronomia',
    local: 'Shopping Serra Sul',
    criador: 'usuario@kdaboa.com',
    presencas: [],
    mensagens: [],
  },
  {
    titulo: 'Cinema na Praça João Pinheiro',
    descricao: 'Telão com filme nacional. Leve sua cadeira de praia.',
    diasAFrente: 0,
    hora: 19,
    duracaoHoras: 2,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Cultura',
    local: 'Praça João Pinheiro',
    criador: 'admin@kdaboa.com',
    presencas: ['ana@kdaboa.com', 'usuario@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Stand-up no Teatro Municipal',
    descricao: 'Noite de comédia com humoristas do Sul de Minas.',
    diasAFrente: 0,
    hora: 20,
    duracaoHoras: 2,
    preco: 30,
    classificacaoEtaria: 14,
    categoria: 'Teatro',
    local: 'Teatro Municipal',
    criador: 'organizador@kdaboa.com',
    presencas: ['bruno@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Evento dos Lisos',
    descricao: 'O rolê mais barato da cidade: ingresso a R$ 2 para quem está liso.',
    diasAFrente: 1,
    hora: 19,
    duracaoHoras: 4,
    preco: 2,
    classificacaoEtaria: 0,
    categoria: 'Festas',
    local: 'Bar do Centro',
    criador: 'organizador@kdaboa.com',
    ingressos: 100,
    presencas: ['usuario@kdaboa.com'],
    mensagens: [{ autor: 'usuario@kdaboa.com', conteudo: 'Por 2 reais até eu vou!' }],
  },
  {
    titulo: 'Festa do Peão de Pouso Alegre: Ana Castela',
    descricao: 'Noite de abertura com rodeio e show da Ana Castela. Pista gratuita; preço do setor Privilege.',
    diasAFrente: 1,
    hora: 20,
    duracaoHoras: 6,
    preco: 149,
    classificacaoEtaria: 16,
    categoria: 'Shows',
    local: 'Área de Eventos da Festa de Peão',
    criador: 'admin@kdaboa.com',
    presencas: ['usuario@kdaboa.com', 'bruno@kdaboa.com', 'ana@kdaboa.com', 'admin@kdaboa.com'],
    mensagens: [
      { autor: 'bruno@kdaboa.com', conteudo: 'Bora de rodeio! Alguém vai de carona?' },
      { autor: 'usuario@kdaboa.com', conteudo: 'Eu vou, tenho duas vagas no carro.' },
    ],
  },
  {
    titulo: 'Festa do Peão de Pouso Alegre: Menos É Mais',
    descricao: 'Segunda noite com rodeio e pagode do Menos É Mais. Portões às 20h.',
    diasAFrente: 2,
    hora: 20,
    duracaoHoras: 6,
    preco: 129,
    classificacaoEtaria: 16,
    categoria: 'Shows',
    local: 'Área de Eventos da Festa de Peão',
    criador: 'admin@kdaboa.com',
    presencas: ['ana@kdaboa.com', 'usuario@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Festa do Peão de Pouso Alegre: Chitãozinho & Xororó',
    descricao: 'Rodeio e shows de Chitãozinho & Xororó e Bruninho & Davi. Pista gratuita; preço do setor Privilege.',
    diasAFrente: 3,
    hora: 20,
    duracaoHoras: 6,
    preco: 149,
    classificacaoEtaria: 16,
    categoria: 'Shows',
    local: 'Área de Eventos da Festa de Peão',
    criador: 'admin@kdaboa.com',
    presencas: ['admin@kdaboa.com', 'bruno@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Festa do Peão de Pouso Alegre: Simone Mendes',
    descricao: 'Abertura da segunda semana com rodeio e show da Simone Mendes.',
    diasAFrente: 8,
    hora: 20,
    duracaoHoras: 6,
    preco: 129,
    classificacaoEtaria: 16,
    categoria: 'Shows',
    local: 'Área de Eventos da Festa de Peão',
    criador: 'admin@kdaboa.com',
    presencas: ['ana@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Festa do Peão de Pouso Alegre: Leonardo',
    descricao: 'Rodeio e show do Leonardo.',
    diasAFrente: 9,
    hora: 20,
    duracaoHoras: 6,
    preco: 129,
    classificacaoEtaria: 16,
    categoria: 'Shows',
    local: 'Área de Eventos da Festa de Peão',
    criador: 'admin@kdaboa.com',
    presencas: ['usuario@kdaboa.com', 'admin@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Festa do Peão de Pouso Alegre: César Menotti & Fabiano',
    descricao: 'Encerramento com final do rodeio e shows de César Menotti & Fabiano, Danilo & Davi e Open Farra.',
    diasAFrente: 10,
    hora: 20,
    duracaoHoras: 7,
    preco: 129,
    classificacaoEtaria: 16,
    categoria: 'Shows',
    local: 'Área de Eventos da Festa de Peão',
    criador: 'admin@kdaboa.com',
    presencas: ['bruno@kdaboa.com', 'ana@kdaboa.com', 'usuario@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Agita P.A. - Aniversário de Pouso Alegre',
    descricao: 'Shows gratuitos em comemoração ao aniversário da cidade.',
    diasAFrente: 3,
    hora: 19,
    duracaoHoras: 5,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Shows',
    local: 'Área de Eventos da Festa de Peão',
    criador: 'admin@kdaboa.com',
    presencas: ['ana@kdaboa.com', 'usuario@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'P.A.RRAIÁ',
    descricao: 'Festa junina com quadrilhas, comidas típicas, feira de artesanato e fogueira.',
    diasAFrente: 5,
    hora: 17,
    duracaoHoras: 6,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Festas',
    local: 'Praça Central',
    criador: 'usuario@kdaboa.com',
    presencas: ['ana@kdaboa.com', 'bruno@kdaboa.com'],
    mensagens: [{ autor: 'ana@kdaboa.com', conteudo: 'Quero muito o quentão!' }],
  },
  {
    titulo: 'Festival do Pastel de Farinha de Milho',
    descricao: 'O pastel mais famoso do Sul de Minas, com barracas e música ao vivo.',
    diasAFrente: 7,
    hora: 18,
    duracaoHoras: 5,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Gastronomia',
    local: 'Praça Central',
    criador: 'admin@kdaboa.com',
    presencas: ['usuario@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Festa de São Bom Jesus',
    descricao: 'Festa do padroeiro, com missas, procissão e barraquinhas.',
    diasAFrente: 10,
    hora: 18,
    duracaoHoras: 4,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Cultura',
    local: 'Catedral Metropolitana Senhor Bom Jesus',
    criador: 'admin@kdaboa.com',
    presencas: ['ana@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Festa de Santa Rita',
    descricao: 'Celebração religiosa com missas, procissão e barraquinhas.',
    diasAFrente: 13,
    hora: 19,
    duracaoHoras: 3,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Cultura',
    local: 'Praça João Pinheiro',
    criador: 'usuario@kdaboa.com',
    presencas: [],
    mensagens: [],
  },
  {
    titulo: 'Festival Cultural do Mandú',
    descricao: 'Música, artes visuais e oficinas gratuitas para toda a família.',
    diasAFrente: 17,
    hora: 15,
    duracaoHoras: 6,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Cultura',
    local: 'Parque Municipal',
    criador: 'admin@kdaboa.com',
    presencas: ['ana@kdaboa.com', 'usuario@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Pouso Alegre Gastrô',
    descricao: 'Festival da culinária mineira com chefs e restaurantes da cidade.',
    diasAFrente: 20,
    hora: 12,
    duracaoHoras: 8,
    preco: 10,
    classificacaoEtaria: 0,
    categoria: 'Gastronomia',
    local: 'Espaço de Eventos',
    criador: 'usuario@kdaboa.com',
    presencas: ['bruno@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Bloco de Carnaval na Dr. Lisboa',
    descricao: 'Bloco de rua com marchinhas e axé pela avenida.',
    diasAFrente: 25,
    hora: 16,
    duracaoHoras: 6,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Festas',
    local: 'Avenida principal',
    criador: 'admin@kdaboa.com',
    presencas: ['bruno@kdaboa.com', 'ana@kdaboa.com', 'usuario@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Noite de rock autoral',
    descricao: 'Bandas da cidade tocando músicas próprias.',
    diasAFrente: 2,
    hora: 21,
    duracaoHoras: 4,
    preco: 20,
    classificacaoEtaria: 18,
    categoria: 'Shows',
    local: 'Bar do Centro',
    criador: 'admin@kdaboa.com',
    presencas: ['usuario@kdaboa.com', 'ana@kdaboa.com', 'bruno@kdaboa.com'],
    mensagens: [
      { autor: 'ana@kdaboa.com', conteudo: 'Alguém sabe que horas a primeira banda começa?' },
      { autor: 'admin@kdaboa.com', conteudo: 'Às 21h em ponto!' },
    ],
  },
  {
    titulo: 'Feira gastronômica da praça',
    descricao: 'Food trucks e barracas de comida típica.',
    diasAFrente: 4,
    hora: 17,
    duracaoHoras: 5,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Gastronomia',
    local: 'Praça Central',
    criador: 'usuario@kdaboa.com',
    presencas: ['usuario@kdaboa.com', 'ana@kdaboa.com'],
    mensagens: [{ autor: 'usuario@kdaboa.com', conteudo: 'Vai ter opção vegetariana!' }],
  },
  {
    titulo: 'Festa universitária de fim de semestre',
    descricao: 'DJ convidado e open bar até meia-noite.',
    diasAFrente: 6,
    hora: 22,
    duracaoHoras: 5,
    preco: 35,
    classificacaoEtaria: 18,
    categoria: 'Festas',
    local: 'Espaço de Eventos',
    criador: 'admin@kdaboa.com',
    presencas: ['bruno@kdaboa.com', 'usuario@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Corrida de rua 5 km',
    descricao: 'Corrida aberta para todas as idades, com medalha para quem completar.',
    diasAFrente: 9,
    hora: 7,
    duracaoHoras: 3,
    preco: 15,
    classificacaoEtaria: 0,
    categoria: 'Esporte',
    local: 'Parque Municipal',
    criador: 'admin@kdaboa.com',
    presencas: ['bruno@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Peça: O Auto da Compadecida',
    descricao: 'Grupo de teatro local apresenta o clássico de Ariano Suassuna.',
    diasAFrente: 12,
    hora: 20,
    duracaoHoras: 2,
    preco: 25,
    classificacaoEtaria: 14,
    categoria: 'Teatro',
    local: 'Espaço de Eventos',
    criador: 'admin@kdaboa.com',
    presencas: ['ana@kdaboa.com'],
    mensagens: [],
  },
  {
    titulo: 'Sarau cultural na avenida',
    descricao: 'Poesia, música acústica e exposição de artistas da região.',
    diasAFrente: 15,
    hora: 18,
    duracaoHoras: 4,
    preco: 0,
    classificacaoEtaria: 0,
    categoria: 'Cultura',
    local: 'Avenida principal',
    criador: 'usuario@kdaboa.com',
    presencas: ['ana@kdaboa.com', 'admin@kdaboa.com'],
    mensagens: [],
  },
];

const seguidores = [
  ['usuario@kdaboa.com', 'ana@kdaboa.com'],
  ['ana@kdaboa.com', 'usuario@kdaboa.com'],
  ['bruno@kdaboa.com', 'ana@kdaboa.com'],
];

function dataDaquiA(dias: number, hora: number, agora = false) {
  const data = new Date();
  if (agora) {
    data.setHours(data.getHours() - 1, 0, 0, 0);
    return data;
  }
  data.setDate(data.getDate() + dias);
  data.setHours(hora, 0, 0, 0);
  return data;
}

async function main() {
  for (const l of locaisExtras) {
    const existe = await prisma.local.findFirst({ where: { nome: l.nome } });
    if (existe) {
      await prisma.local.update({ where: { id: existe.id }, data: l });
    } else {
      await prisma.local.create({ data: l });
    }
  }

  const categorias = new Map((await prisma.categoria.findMany()).map((c) => [c.nome, c.id]));
  const locais = new Map((await prisma.local.findMany()).map((l) => [l.nome, l.id]));

  if (categorias.size === 0 || locais.size === 0) {
    throw new Error('Categorias ou locais vazios. Rode as migrations antes: pnpm --filter kdaboa-backend db:migrate');
  }

  const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);
  const ids = new Map<string, string>();

  for (const u of usuarios) {
    const usuario = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, perfil: u.perfil, senhaHash, cnpj: u.cnpj, nomeFantasia: u.nomeFantasia },
      create: {
        nome: u.nome,
        email: u.email,
        perfil: u.perfil,
        senhaHash,
        cnpj: u.cnpj,
        nomeFantasia: u.nomeFantasia,
        dataNascimento: u.cnpj ? null : new Date('2000-01-01'),
      },
    });
    ids.set(u.email, usuario.id);

    await prisma.usuarioInteresse.createMany({
      data: u.interesses
        .filter((nome) => categorias.has(nome))
        .map((nome) => ({ usuarioId: usuario.id, categoriaId: categorias.get(nome) as number })),
      skipDuplicates: true,
    });
  }

  for (const e of eventos) {
    const categoriaId = categorias.get(e.categoria);
    const localId = locais.get(e.local);
    if (!categoriaId || !localId) {
      throw new Error(`Categoria "${e.categoria}" ou local "${e.local}" não existe no banco.`);
    }

    const dataInicio = dataDaquiA(e.diasAFrente, e.hora, e.agora);
    const dataFim = new Date(dataInicio.getTime() + e.duracaoHoras * 60 * 60 * 1000);
    const dados = {
      descricao: e.descricao,
      dataInicio,
      dataFim,
      preco: e.preco,
      classificacaoEtaria: e.classificacaoEtaria,
      categoriaId,
      localId,
    };

    const existente = await prisma.evento.findFirst({ where: { titulo: e.titulo } });
    const venda = e.ingressos
      ? {
          verificado: true,
          vendaNoApp: true,
          quantidadeIngressos: existente?.quantidadeIngressos ?? e.ingressos,
        }
      : {};
    const evento = existente
      ? await prisma.evento.update({ where: { id: existente.id }, data: { ...dados, ...venda } })
      : await prisma.evento.create({
          data: { ...dados, ...venda, titulo: e.titulo, criadorId: ids.get(e.criador) as string },
        });

    await prisma.presenca.createMany({
      data: e.presencas.map((email) => ({ usuarioId: ids.get(email) as string, eventoId: evento.id })),
      skipDuplicates: true,
    });

    const totalMensagens = await prisma.mensagem.count({ where: { eventoId: evento.id } });
    if (totalMensagens === 0 && e.mensagens.length > 0) {
      await prisma.mensagem.createMany({
        data: e.mensagens.map((m) => ({
          eventoId: evento.id,
          usuarioId: ids.get(m.autor) as string,
          conteudo: m.conteudo,
        })),
      });
    }
  }

  await prisma.seguidor.createMany({
    data: seguidores.map(([seguidor, seguido]) => ({
      seguidorId: ids.get(seguidor) as string,
      seguidoId: ids.get(seguido) as string,
    })),
    skipDuplicates: true,
  });

  console.log(`Seed concluída: ${usuarios.length} usuários e ${eventos.length} eventos.`);
  console.log(`Senha de todos os usuários de teste: ${SENHA_DEMO}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
