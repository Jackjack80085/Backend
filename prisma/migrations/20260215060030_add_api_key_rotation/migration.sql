-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "lastKeyRotation" TIMESTAMP(3),
ADD COLUMN     "previousApiKeys" JSONB;
