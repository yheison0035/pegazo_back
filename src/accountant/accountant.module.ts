import { Module } from '@nestjs/common';
import { AccountantService } from './accountant.service';
import { AccountantController } from './accountant.controller';
import { PrismaService } from '@/prisma.service';
import { AuthModule } from '@/auth/auth.module';
import { AccountingService } from '@/accounting/accounting.service';
import { ManualEntriesService } from '@/accounting/manual-entries.service';
import { LedgerAccountsService } from '@/ledger-accounts/ledger-accounts.service';
import { TaxService } from '@/tax/tax.service';
import { PartiesService } from '@/parties/parties.service';
import { FiscalModule } from '@/fiscal/fiscal.module';

@Module({
  imports: [AuthModule, FiscalModule], // JwtModule + estrategia jwt + motor fiscal
  controllers: [AccountantController],
  // Reutiliza los servicios de contabilidad (solo usan companyId) para servir
  // la contabilidad de una empresa enlazada.
  providers: [
    AccountantService,
    PrismaService,
    AccountingService,
    ManualEntriesService,
    LedgerAccountsService,
    TaxService,
    PartiesService,
  ],
})
export class AccountantModule {}
