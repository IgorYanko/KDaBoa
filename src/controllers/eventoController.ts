import { Request, Response } from 'express';

// Dados falsos (mock) simulando o banco de dados
let eventosMock = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    titulo: "Noite de rock autoral",
    descricao: "Bandas autorais da região tocando a noite toda.",
    data_inicio: "2026-11-13T21:00:00Z",
    preco: 0,
    classificacao_etaria: 16,
    categoria_id: 1,
    local_id: 1,
    criador_id: "987fcdeb-51a2-43d7-9012-345678901234"
  }
];

export const eventoController = {
  listar: (req: Request, res: Response) => {
    res.json(eventosMock);
  },

  buscarPorId: (req: Request, res: Response) => {
    const { id } = req.params;
    const evento = eventosMock.find(e => e.id === id);
    if (!evento) return res.status(404).json({ erro: "Evento não encontrado" });
    res.json(evento);
  },

  // Novo: Simula a criação de um evento
  criar: (req: Request, res: Response) => {
    const { titulo, descricao, data_inicio, preco, classificacao_etaria, categoria_id, local_id } = req.body;
    
    const novoEvento = {
      id: `uuid-novo-evento-${Date.now()}`,
      titulo,
      descricao,
      data_inicio,
      preco: preco || 0,
      classificacao_etaria: classificacao_etaria || 0,
      categoria_id,
      local_id,
      criador_id: "987fcdeb-51a2-43d7-9012-345678901234" // ID fixo do usuário logado
    };

    eventosMock.push(novoEvento);
    res.status(201).json({ mensagem: "Evento criado com sucesso", evento: novoEvento });
  },

  // Novo: Simula a edição de um evento
  atualizar: (req: Request, res: Response) => {
    const { id } = req.params;
    const index = eventosMock.findIndex(e => e.id === id);
    
    if (index === -1) return res.status(404).json({ erro: "Evento não encontrado" });

    // Atualiza os dados preservando o que não foi enviado
    eventosMock[index] = { ...eventosMock[index], ...req.body };
    res.json({ mensagem: "Evento atualizado com sucesso", evento: eventosMock[index] });
  },

  // Novo: Simula a exclusão de um evento
  excluir: (req: Request, res: Response) => {
    const { id } = req.params;
    const index = eventosMock.findIndex(e => e.id === id);
    
    if (index === -1) return res.status(404).json({ erro: "Evento não encontrado" });

    eventosMock.splice(index, 1);
    res.json({ mensagem: "Evento excluído com sucesso" });
  }
};