import { Request, Response } from 'express';

// Dados falsos (mock) simulando o banco de dados
const eventosMock = [
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
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    titulo: "Sarau na praça",
    descricao: "Evento cultural aberto ao público.",
    data_inicio: "2026-11-14T18:00:00Z",
    preco: 0,
    classificacao_etaria: 0, // Livre
    categoria_id: 3,
    local_id: 2,
    criador_id: "987fcdeb-51a2-43d7-9012-345678901234"
  }
];

export const eventoController = {
  // Lista todos os eventos
  listar: (req: Request, res: Response) => {
    res.json(eventosMock);
  },

  // Busca um evento por ID
  buscarPorId: (req: Request, res: Response) => {
    const { id } = req.params;
    const evento = eventosMock.find(e => e.id === id);
    
    if (!evento) {
      return res.status(404).json({ erro: "Evento não encontrado" });
    }
    
    res.json(evento);
  },

  // Cria um novo evento (Adicionado agora!)
  criar: (req: Request, res: Response) => {
    const novoEventoBody = req.body;
    
    const novoEvento = {
      // Cria um ID falso rapidinho só para o mock
      id: "mock-" + Math.floor(Math.random() * 10000), 
      ...novoEventoBody,
      // Pega o ID do usuário que o middleware validou e injetou (se existir)
      criador_id: (req as any).usuario?.id || "id-criador-desconhecido"
    };

    // Adiciona no nosso banco de dados falso
    eventosMock.push(novoEvento);

    // Retorna 201 (Created) e os dados do evento salvo
    res.status(201).json(novoEvento);
  }
};