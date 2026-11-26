-- Conta CNPJ (perfil ORGANIZADOR), evento verificado com venda no app, pedido e ingresso.

ALTER TYPE "Perfil" ADD VALUE 'ORGANIZADOR';

ALTER TABLE "usuarios" ALTER COLUMN "data_nascimento" DROP NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN "cnpj" VARCHAR(14);
ALTER TABLE "usuarios" ADD COLUMN "nome_fantasia" VARCHAR(150);
CREATE UNIQUE INDEX "usuarios_cnpj_key" ON "usuarios"("cnpj");

ALTER TABLE "eventos" ADD COLUMN "verificado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "eventos" ADD COLUMN "venda_no_app" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "eventos" ADD COLUMN "quantidade_ingressos" INTEGER;

ALTER TABLE "eventos" ADD CONSTRAINT "eventos_venda_ck" CHECK (
  ("venda_no_app" = false AND "quantidade_ingressos" IS NULL)
  OR (
    "venda_no_app" = true
    AND "verificado" = true
    AND "preco" > 0
    AND "quantidade_ingressos" IS NOT NULL
    AND "quantidade_ingressos" >= 0
  )
);

CREATE TYPE "StatusPedido" AS ENUM ('pendente', 'pago', 'recusado', 'cancelado');
CREATE TYPE "StatusIngresso" AS ENUM ('valido', 'usado', 'cancelado');

CREATE TABLE "pedidos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'pendente',
    "pagamento_externo_id" VARCHAR(64),
    "expira_em" TIMESTAMP(6) NOT NULL,
    "qr_code" TEXT,
    "qr_code_base64" TEXT,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ingressos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pedido_id" UUID NOT NULL,
    "codigo" VARCHAR(16) NOT NULL,
    "status" "StatusIngresso" NOT NULL DEFAULT 'valido',
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingressos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pedidos_pagamento_externo_id_key" ON "pedidos"("pagamento_externo_id");
CREATE INDEX "idx_pedidos_usuario" ON "pedidos"("usuario_id");
CREATE INDEX "idx_pedidos_evento" ON "pedidos"("evento_id");
CREATE INDEX "idx_pedidos_status_expira" ON "pedidos"("status", "expira_em");
CREATE UNIQUE INDEX "ingressos_codigo_key" ON "ingressos"("codigo");
CREATE INDEX "idx_ingressos_pedido" ON "ingressos"("pedido_id");

ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_quantidade_ck" CHECK ("quantidade" > 0);
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_valor_ck" CHECK ("valor_total" > 0);
