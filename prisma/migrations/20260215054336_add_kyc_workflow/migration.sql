/*
  Warnings:

  - You are about to drop the `Partner` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('INVITED', 'REGISTERED', 'KYC_PENDING', 'KYC_REJECTED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "KYCDocumentType" AS ENUM ('BUSINESS_REGISTRATION', 'PAN_CARD', 'GST_CERTIFICATE', 'BANK_PROOF', 'DIRECTOR_ID', 'ADDRESS_PROOF');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "KycStatus" ADD VALUE 'SUBMITTED';
ALTER TYPE "KycStatus" ADD VALUE 'UNDER_REVIEW';

-- DropForeignKey
ALTER TABLE "Settlement" DROP CONSTRAINT "Settlement_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "WebhookLog" DROP CONSTRAINT "WebhookLog_partnerId_fkey";

-- DropTable
DROP TABLE "Partner";

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "phone" TEXT,
    "businessType" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'INVITED',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "invitedBy" UUID,
    "invitedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "kycSubmittedAt" TIMESTAMP(3),
    "kycReviewedAt" TIMESTAMP(3),
    "kycReviewedBy" UUID,
    "kycRejectionReason" TEXT,
    "kycApprovedAt" TIMESTAMP(3),
    "apiKey" TEXT,
    "apiSecretHash" TEXT,
    "apiSecretEncrypted" TEXT,
    "apiKeyActiveFrom" TIMESTAMP(3),
    "apiKeyRevokedAt" TIMESTAMP(3),
    "apiKeyVersion" INTEGER NOT NULL DEFAULT 1,
    "commissionRate" DECIMAL(5,4),
    "bankAccount" JSONB,
    "bankAccountVerified" BOOLEAN DEFAULT false,
    "minSettlementAmount" DECIMAL(15,2),
    "maxDailySettlementAmount" DECIMAL(15,2),
    "maxSettlementsPerDay" INTEGER,
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastApiCallAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "documentType" "KYCDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" UUID,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_businessName_key" ON "partners"("businessName");

-- CreateIndex
CREATE UNIQUE INDEX "partners_email_key" ON "partners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "partners_inviteToken_key" ON "partners"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "partners_apiKey_key" ON "partners"("apiKey");

-- CreateIndex
CREATE INDEX "partners_email_idx" ON "partners"("email");

-- CreateIndex
CREATE INDEX "partners_status_idx" ON "partners"("status");

-- CreateIndex
CREATE INDEX "partners_kycStatus_idx" ON "partners"("kycStatus");

-- CreateIndex
CREATE INDEX "kyc_documents_partnerId_status_idx" ON "kyc_documents"("partnerId", "status");

-- CreateIndex
CREATE INDEX "kyc_documents_partnerId_documentType_idx" ON "kyc_documents"("partnerId", "documentType");

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
