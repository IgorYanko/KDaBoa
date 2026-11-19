-- Locais iniciais (os do Figma), com coordenadas aproximadas em Pouso Alegre.
-- Sem nenhum local, a tela Divulgar não tem onde publicar o evento.
-- Só insere os que ainda não existem (pelo nome), para não duplicar se alguém já cadastrou.
INSERT INTO "locais" ("nome", "endereco", "bairro", "latitude", "longitude")
SELECT v.nome, v.endereco, v.bairro, v.latitude, v.longitude
FROM (VALUES
  ('Bar do Centro', 'Rua Comendador José Garcia, 150', 'Centro', -22.229700, -45.933900),
  ('Praça Central', 'Praça Senador José Bento', 'Centro', -22.230600, -45.936300),
  ('Espaço de Eventos', 'Av. Vereador Antônio da Costa Rios, 800', NULL, -22.240200, -45.925500),
  ('Parque Municipal', 'Av. Prefeito Olavo Gomes de Oliveira', NULL, -22.236200, -45.919800),
  ('Avenida principal', 'Av. Dr. Lisboa', 'Centro', -22.227900, -45.940200)
) AS v(nome, endereco, bairro, latitude, longitude)
WHERE NOT EXISTS (SELECT 1 FROM "locais" l WHERE l."nome" = v.nome);
