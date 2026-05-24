-- CreateEnum
CREATE TYPE "OperatorRole" AS ENUM ('ADMIN', 'OPERATOR');

-- AlterTable
ALTER TABLE "Operator" ADD COLUMN "role" "OperatorRole" NOT NULL DEFAULT 'OPERATOR';
