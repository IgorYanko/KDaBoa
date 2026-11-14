-- Categorias iniciais (as do Figma). O cadastro exige pelo menos um interesse,
-- então a tabela não pode começar vazia.
INSERT INTO "categorias" ("nome") VALUES
  ('Shows'),
  ('Festas'),
  ('Cultura'),
  ('Esporte'),
  ('Gastronomia'),
  ('Teatro')
ON CONFLICT ("nome") DO NOTHING;
