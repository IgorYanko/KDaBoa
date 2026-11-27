-- Chat mútuo: mensagens entre duas pessoas que se seguem nos dois sentidos.
CREATE TABLE "mensagens_diretas" (
    "id" BIGSERIAL NOT NULL,
    "remetente_id" UUID NOT NULL,
    "destinatario_id" UUID NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_diretas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mensagens_diretas_par_ck" CHECK ("remetente_id" <> "destinatario_id")
);

CREATE INDEX "idx_diretas_par_data" ON "mensagens_diretas"("remetente_id", "destinatario_id", "criado_em");
CREATE INDEX "idx_diretas_destinatario_data" ON "mensagens_diretas"("destinatario_id", "criado_em");

ALTER TABLE "mensagens_diretas" ADD CONSTRAINT "mensagens_diretas_remetente_id_fkey" FOREIGN KEY ("remetente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mensagens_diretas" ADD CONSTRAINT "mensagens_diretas_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
