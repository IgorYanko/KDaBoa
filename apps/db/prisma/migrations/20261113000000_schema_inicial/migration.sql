-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "foto_url" VARCHAR(255),
    "mostrar_presenca" BOOLEAN NOT NULL DEFAULT true,
    "lembretes_email" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_redefinicao_senha" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expira_em" TIMESTAMP(6) NOT NULL,
    "usado_em" TIMESTAMP(6),
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_redefinicao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locais" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "cep" VARCHAR(9),
    "endereco" VARCHAR(200) NOT NULL,
    "bairro" VARCHAR(80),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "locais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "data_inicio" TIMESTAMP(6) NOT NULL,
    "data_fim" TIMESTAMP(6),
    "preco" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "classificacao_etaria" SMALLINT NOT NULL DEFAULT 0,
    "imagem_url" VARCHAR(255),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "categoria_id" INTEGER NOT NULL,
    "local_id" INTEGER NOT NULL,
    "criador_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_interesses" (
    "usuario_id" UUID NOT NULL,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "usuario_interesses_pkey" PRIMARY KEY ("usuario_id","categoria_id")
);

-- CreateTable
CREATE TABLE "presencas" (
    "usuario_id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "confirmado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lembrete_enviado_em" TIMESTAMP(6),

    CONSTRAINT "presencas_pkey" PRIMARY KEY ("usuario_id","evento_id")
);

-- CreateTable
CREATE TABLE "seguidores" (
    "seguidor_id" UUID NOT NULL,
    "seguido_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguidores_pkey" PRIMARY KEY ("seguidor_id","seguido_id")
);

-- CreateTable
CREATE TABLE "bloqueios" (
    "bloqueador_id" UUID NOT NULL,
    "bloqueado_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueios_pkey" PRIMARY KEY ("bloqueador_id","bloqueado_id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" BIGSERIAL NOT NULL,
    "evento_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mensagem_id" BIGINT NOT NULL,
    "denunciante_id" UUID NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_redefinicao_senha_token_hash_key" ON "tokens_redefinicao_senha"("token_hash");

-- CreateIndex
CREATE INDEX "idx_tokens_usuario" ON "tokens_redefinicao_senha"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE INDEX "idx_eventos_data_inicio" ON "eventos"("data_inicio");

-- CreateIndex
CREATE INDEX "idx_eventos_categoria" ON "eventos"("categoria_id");

-- CreateIndex
CREATE INDEX "idx_presencas_evento" ON "presencas"("evento_id");

-- CreateIndex
CREATE INDEX "idx_seguidores_seguido" ON "seguidores"("seguido_id");

-- CreateIndex
CREATE INDEX "idx_mensagens_evento_data" ON "mensagens"("evento_id", "criado_em");

-- CreateIndex
CREATE INDEX "idx_denuncias_status" ON "denuncias"("status");

-- CreateIndex
CREATE UNIQUE INDEX "denuncias_mensagem_id_denunciante_id_key" ON "denuncias"("mensagem_id", "denunciante_id");

-- AddForeignKey
ALTER TABLE "tokens_redefinicao_senha" ADD CONSTRAINT "tokens_redefinicao_senha_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "locais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_criador_id_fkey" FOREIGN KEY ("criador_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_interesses" ADD CONSTRAINT "usuario_interesses_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_interesses" ADD CONSTRAINT "usuario_interesses_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguidores" ADD CONSTRAINT "seguidores_seguidor_id_fkey" FOREIGN KEY ("seguidor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguidores" ADD CONSTRAINT "seguidores_seguido_id_fkey" FOREIGN KEY ("seguido_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios" ADD CONSTRAINT "bloqueios_bloqueador_id_fkey" FOREIGN KEY ("bloqueador_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios" ADD CONSTRAINT "bloqueios_bloqueado_id_fkey" FOREIGN KEY ("bloqueado_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_mensagem_id_fkey" FOREIGN KEY ("mensagem_id") REFERENCES "mensagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_denunciante_id_fkey" FOREIGN KEY ("denunciante_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Restrições CHECK (o Prisma não as representa no schema.prisma, por isso ficam só na migration)
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_preco_ck" CHECK ("preco" >= 0);

ALTER TABLE "eventos" ADD CONSTRAINT "eventos_classificacao_ck" CHECK ("classificacao_etaria" IN (0, 14, 16, 18));

ALTER TABLE "eventos" ADD CONSTRAINT "eventos_datas_ck" CHECK ("data_fim" IS NULL OR "data_fim" > "data_inicio");

ALTER TABLE "seguidores" ADD CONSTRAINT "seguidores_diferentes_ck" CHECK ("seguidor_id" <> "seguido_id");

ALTER TABLE "bloqueios" ADD CONSTRAINT "bloqueios_diferentes_ck" CHECK ("bloqueador_id" <> "bloqueado_id");

ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conteudo_ck" CHECK (length(trim("conteudo")) > 0);

ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_status_ck" CHECK ("status" IN ('pendente', 'analisada', 'descartada'));
