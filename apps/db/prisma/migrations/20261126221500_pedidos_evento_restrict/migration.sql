-- Excluir o evento não pode apagar pedido (pago ou não). A API recusa a exclusão antes.
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_evento_id_fkey";

ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_evento_id_fkey"
  FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
