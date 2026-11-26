-- A capa do evento pode vir como a foto reduzida pelo front (data URL), que não cabe em 255 caracteres.
ALTER TABLE "eventos" ALTER COLUMN "imagem_url" TYPE TEXT;
