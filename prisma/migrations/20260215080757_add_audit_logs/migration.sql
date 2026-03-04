-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('ADMIN', 'PARTNER', 'SYSTEM');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_action_createdAt_idx" ON "audit_logs"("targetId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");
