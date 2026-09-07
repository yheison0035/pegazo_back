-- Membresías / mensualidades recurrentes por cliente + sus cobros.
CREATE TABLE IF NOT EXISTS "Membership" (
  "id" SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "customerId" INTEGER,
  "name" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "dueDay" INTEGER,
  "localId" INTEGER NOT NULL,
  "notes" TEXT,
  "status" "Status" NOT NULL DEFAULT 'ACTIVO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "MembershipPayment" (
  "id" SERIAL PRIMARY KEY,
  "membershipId" INTEGER NOT NULL,
  "companyId" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "paidDate" TIMESTAMP(3) NOT NULL,
  "paymentMethod" "PaymentMethod",
  "notes" TEXT,
  "status" "Status" NOT NULL DEFAULT 'ACTIVO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Membership_companyId_idx" ON "Membership"("companyId");
CREATE INDEX IF NOT EXISTS "Membership_localId_idx" ON "Membership"("localId");
CREATE INDEX IF NOT EXISTS "Membership_customerId_idx" ON "Membership"("customerId");
CREATE INDEX IF NOT EXISTS "MembershipPayment_membershipId_idx" ON "MembershipPayment"("membershipId");
CREATE INDEX IF NOT EXISTS "MembershipPayment_companyId_idx" ON "MembershipPayment"("companyId");
CREATE INDEX IF NOT EXISTS "MembershipPayment_paidDate_idx" ON "MembershipPayment"("paidDate");
DO $$ BEGIN
  ALTER TABLE "Membership" ADD CONSTRAINT "Membership_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Membership" ADD CONSTRAINT "Membership_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "MembershipPayment" ADD CONSTRAINT "MembershipPayment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
