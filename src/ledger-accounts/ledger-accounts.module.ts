import { Module } from '@nestjs/common';
import { LedgerAccountsService } from './ledger-accounts.service';
import { LedgerAccountsController } from './ledger-accounts.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [LedgerAccountsController],
  providers: [LedgerAccountsService, PrismaService],
})
export class LedgerAccountsModule {}
