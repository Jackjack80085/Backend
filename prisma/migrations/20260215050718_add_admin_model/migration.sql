-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('PLATFORM', 'PARTNER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'NETBANKING', 'WALLET');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "LedgerEntryReason" AS ENUM ('PAYMENT', 'COMMISSION', 'SETTLEMENT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('OK', 'MISMATCH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateTable
CREATE TABLE "Partner" (
    "id" UUID NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecretHash" TEXT,
    "apiSecretEncrypted" TEXT,
    "apiKeyActiveFrom" TIMESTAMP(3) NOT NULL,
    "apiKeyRevokedAt" TIMESTAMP(3),
    "lastApiCallAt" TIMESTAMP(3),
    "apiKeyVersion" INTEGER NOT NULL DEFAULT 1,
    "businessName" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,4),
    "bankAccount" JSONB,
    "bankAccountVerified" BOOLEAN DEFAULT false,
    "minSettlementAmount" DECIMAL(15,2),
    "maxDailySettlementAmount" DECIMAL(15,2),
    "maxSettlementsPerDay" INTEGER,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "businessType" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "webhookUrl" TEXT,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "partnerId" UUID,
    "type" "WalletType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lastReconciledAt" TIMESTAMP(3),
    "lastReconciliationStatus" "ReconciliationStatus",
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "commission" DECIMAL(15,2) NOT NULL,
    "netAmount" DECIMAL(15,2) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "paymentUrl" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "callbackUrl" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paywiseTxnId" TEXT,
    "paywiseSessionId" TEXT,
    "paywiseResponse" JSONB,
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "userReference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "reason" "LedgerEntryReason" NOT NULL,
    "relatedTransactionId" UUID,
    "paywiseTxnId" TEXT,
    "description" TEXT,
    "relatedSettlementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "fee" DECIMAL(15,2) NOT NULL,
    "netAmount" DECIMAL(15,2) NOT NULL,
    "totalDeducted" DECIMAL(15,2) NOT NULL,
    "bankAccountSnapshot" JSONB,
    "initiatedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "processedBy" UUID,
    "completedAt" TIMESTAMP(3),
    "completedBy" UUID,
    "bankReferenceId" TEXT,
    "failureReason" TEXT,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "transactionId" UUID,
    "settlementId" UUID,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "errorMessage" TEXT,
    "attempt" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_apiKey_key" ON "Partner"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_businessName_key" ON "Partner"("businessName");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- CreateIndex
CREATE INDEX "Partner_email_idx" ON "Partner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_partnerId_key" ON "Wallet"("partnerId");

-- CreateIndex
CREATE INDEX "Wallet_partnerId_idx" ON "Wallet"("partnerId");

-- CreateIndex
CREATE INDEX "Wallet_type_idx" ON "Wallet"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_paywiseSessionId_key" ON "Transaction"("paywiseSessionId");

-- CreateIndex
CREATE INDEX "Transaction_partnerId_idx" ON "Transaction"("partnerId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_paywiseTxnId_idx" ON "Transaction"("paywiseTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_partnerId_idempotencyKey_key" ON "Transaction"("partnerId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_relatedTransactionId_idx" ON "WalletTransaction"("relatedTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_paywiseTxnId_key" ON "WalletTransaction"("paywiseTxnId");

-- CreateIndex
CREATE INDEX "Settlement_partnerId_idx" ON "Settlement"("partnerId");

-- CreateIndex
CREATE INDEX "Settlement_walletId_idx" ON "Settlement"("walletId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "WebhookLog_partnerId_createdAt_idx" ON "WebhookLog"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_transactionId_idx" ON "WebhookLog"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "admins"("email");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
