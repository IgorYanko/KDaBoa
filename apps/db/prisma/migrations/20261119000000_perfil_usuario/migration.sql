-- O release 3 (#83) acrescentou o perfil do usuário no schema sem a migration:
-- sem esta coluna, toda consulta em "usuarios" falha (login e cadastro respondem 500).

-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('USUARIO', 'ADMIN');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "perfil" "Perfil" NOT NULL DEFAULT 'USUARIO';
