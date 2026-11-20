-- Préstamos (tipo de negocio FINANCIERA): motor de crédito independiente del
-- fiado de ventas. TODO es ADITIVO (enums, columnas y tablas nuevas): no
-- modifica ni borra nada de los tipos de negocio existentes.
-- Idempotente: se puede ejecutar varias veces sin error.
--   npx prisma db execute --file prisma/migrations/20261120120000_prestamos_financiera/migration.sql --schema prisma/schema.prisma

-- 1) Valores nuevos en enums existentes (solo se AÑADEN)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COBRADOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ANALISTA';
ALTER TYPE "BusinessType" ADD VALUE IF NOT EXISTS 'FINANCIERA';

-- 2) Enums propios del motor de préstamos
DO $$ BEGIN
    CREATE TYPE "LoanFrequency" AS ENUM ('DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "LoanAmortization" AS ENUM ('SIMPLE', 'FRANCES', 'ALEMAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "LoanStatus" AS ENUM ('SOLICITADO', 'APROBADO', 'RECHAZADO', 'DESEMBOLSADO', 'PAGADO', 'REFINANCIADO', 'CASTIGADO', 'ANULADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "LoanPaymentStatus" AS ENUM ('ACTIVO', 'ANULADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Configuración de préstamos por empresa
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "loanSettings" JSONB;

-- 4) Productos de crédito
CREATE TABLE IF NOT EXISTS "LoanProduct" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "interestRate" DECIMAL(7,3) NOT NULL,
    "moraRate" DECIMAL(7,3),
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "frequency" "LoanFrequency" NOT NULL DEFAULT 'MENSUAL',
    "amortization" "LoanAmortization" NOT NULL DEFAULT 'SIMPLE',
    "minTerm" INTEGER,
    "maxTerm" INTEGER,
    "minAmount" DECIMAL(14,2),
    "maxAmount" DECIMAL(14,2),
    "roundTo" INTEGER NOT NULL DEFAULT 1,
    "status" "Status" NOT NULL DEFAULT 'ACTIVO',
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoanProduct_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LoanProduct_companyId_idx" ON "LoanProduct"("companyId");
DO $$ BEGIN
    ALTER TABLE "LoanProduct" ADD CONSTRAINT "LoanProduct_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5) Perfil crediticio del cliente
CREATE TABLE IF NOT EXISTS "CustomerCreditProfile" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "productId" INTEGER,
    "customRate" DECIMAL(7,3),
    "creditLimit" DECIMAL(14,2),
    "riskCategory" TEXT,
    "score" INTEGER,
    "monthlyIncome" DECIMAL(14,2),
    "occupation" TEXT,
    "workplace" TEXT,
    "references" JSONB,
    "guarantorName" TEXT,
    "guarantorDocument" TEXT,
    "guarantorPhone" TEXT,
    "guarantorAddress" TEXT,
    "collectorId" INTEGER,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerCreditProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerCreditProfile_customerId_key" ON "CustomerCreditProfile"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerCreditProfile_companyId_idx" ON "CustomerCreditProfile"("companyId");
CREATE INDEX IF NOT EXISTS "CustomerCreditProfile_collectorId_idx" ON "CustomerCreditProfile"("collectorId");
DO $$ BEGIN
    ALTER TABLE "CustomerCreditProfile" ADD CONSTRAINT "CustomerCreditProfile_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "CustomerCreditProfile" ADD CONSTRAINT "CustomerCreditProfile_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "CustomerCreditProfile" ADD CONSTRAINT "CustomerCreditProfile_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "CustomerCreditProfile" ADD CONSTRAINT "CustomerCreditProfile_collectorId_fkey"
        FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) Préstamos
CREATE TABLE IF NOT EXISTS "Loan" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'DESEMBOLSADO',
    "principal" DECIMAL(14,2) NOT NULL,
    "interestRate" DECIMAL(7,3) NOT NULL,
    "moraRate" DECIMAL(7,3) NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "frequency" "LoanFrequency" NOT NULL,
    "amortization" "LoanAmortization" NOT NULL DEFAULT 'SIMPLE',
    "termCount" INTEGER NOT NULL,
    "roundTo" INTEGER NOT NULL DEFAULT 1,
    "rateSource" TEXT,
    "totalInterest" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" INTEGER,
    "disbursedAt" TIMESTAMP(3),
    "disbursedById" INTEGER,
    "disbursementMethod" "PaymentMethod",
    "disbursementCashMovementId" INTEGER,
    "firstDueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "notes" TEXT,
    "refinancedFromId" INTEGER,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER,
    "collectorId" INTEGER,
    "localId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Loan_companyId_code_key" ON "Loan"("companyId", "code");
CREATE INDEX IF NOT EXISTS "Loan_companyId_idx" ON "Loan"("companyId");
CREATE INDEX IF NOT EXISTS "Loan_customerId_idx" ON "Loan"("customerId");
CREATE INDEX IF NOT EXISTS "Loan_collectorId_idx" ON "Loan"("collectorId");
CREATE INDEX IF NOT EXISTS "Loan_status_idx" ON "Loan"("status");
CREATE INDEX IF NOT EXISTS "Loan_localId_idx" ON "Loan"("localId");
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_approvedById_fkey"
        FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_disbursedById_fkey"
        FOREIGN KEY ("disbursedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_refinancedFromId_fkey"
        FOREIGN KEY ("refinancedFromId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_collectorId_fkey"
        FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_localId_fkey"
        FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Loan" ADD CONSTRAINT "Loan_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7) Cuotas
CREATE TABLE IF NOT EXISTS "LoanInstallment" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "capital" DECIMAL(14,2) NOT NULL,
    "interest" DECIMAL(14,2) NOT NULL,
    "capitalPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "interestPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "moraPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "loanId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoanInstallment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LoanInstallment_loanId_idx" ON "LoanInstallment"("loanId");
CREATE INDEX IF NOT EXISTS "LoanInstallment_companyId_idx" ON "LoanInstallment"("companyId");
CREATE INDEX IF NOT EXISTS "LoanInstallment_dueDate_idx" ON "LoanInstallment"("dueDate");
DO $$ BEGIN
    ALTER TABLE "LoanInstallment" ADD CONSTRAINT "LoanInstallment_loanId_fkey"
        FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8) Abonos
CREATE TABLE IF NOT EXISTS "LoanPayment" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'EFECTIVO',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "status" "LoanPaymentStatus" NOT NULL DEFAULT 'ACTIVO',
    "capitalApplied" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "interestApplied" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "moraApplied" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "allocation" JSONB,
    "cashMovementId" INTEGER,
    "annulledAt" TIMESTAMP(3),
    "annulReason" TEXT,
    "annulledById" INTEGER,
    "loanId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoanPayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LoanPayment_loanId_idx" ON "LoanPayment"("loanId");
CREATE INDEX IF NOT EXISTS "LoanPayment_companyId_idx" ON "LoanPayment"("companyId");
CREATE INDEX IF NOT EXISTS "LoanPayment_createdById_idx" ON "LoanPayment"("createdById");
CREATE INDEX IF NOT EXISTS "LoanPayment_paidAt_idx" ON "LoanPayment"("paidAt");
DO $$ BEGIN
    ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_annulledById_fkey"
        FOREIGN KEY ("annulledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_loanId_fkey"
        FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
