import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { ManualEntriesService } from './manual-entries.service';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [AccountingController],
  providers: [AccountingService, ManualEntriesService, PrismaService],
})
export class AccountingModule {}
