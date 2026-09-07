-- Gastos fijos (plantillas recurrentes) + vínculo del gasto real que los paga.
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "fixedExpenseId" INTEGER;

CREATE TABLE IF NOT EXISTS "FixedExpense" (
  "id" SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "dueDay" INTEGER,
  "expenseCategoryId" INTEGER,
  "localId" INTEGER NOT NULL,
  "providerId" INTEGER,
  "paidTo" TEXT,
  "notes" TEXT,
  "status" "Status" NOT NULL DEFAULT 'ACTIVO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "FixedExpense_companyId_idx" ON "FixedExpense"("companyId");
CREATE INDEX IF NOT EXISTS "FixedExpense_localId_idx" ON "FixedExpense"("localId");
CREATE INDEX IF NOT EXISTS "Expense_fixedExpenseId_idx" ON "Expense"("fixedExpenseId");

DO $$ BEGIN
  ALTER TABLE "Expense" ADD CONSTRAINT "Expense_fixedExpenseId_fkey"
    FOREIGN KEY ("fixedExpenseId") REFERENCES "FixedExpense"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_localId_fkey"
    FOREIGN KEY ("localId") REFERENCES "Local"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_expenseCategoryId_fkey"
    FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
