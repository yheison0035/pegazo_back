import { Module } from '@nestjs/common';
import { AccountantService } from './accountant.service';
import { AccountantController } from './accountant.controller';
import { PrismaService } from '@/prisma.service';
import { AuthModule } from '@/auth/auth.module';
import { AccountingService } from '@/accounting/accounting.service';
import { LedgerAccountsService } from '@/ledger-accounts/ledger-accounts.service';
import { TaxService } from '@/tax/tax.service';

@Module({
  imports: [AuthModule], // JwtModule (firmar token) + estrategia jwt
  controllers: [AccountantController],
  // Reutiliza los servicios de contabilidad (solo usan companyId) para servir
  // la contabilidad de una empresa enlazada.
  providers: [
    AccountantService,
    PrismaService,
    AccountingService,
    LedgerAccountsService,
    TaxService,
  ],
})
export class AccountantModule {}
