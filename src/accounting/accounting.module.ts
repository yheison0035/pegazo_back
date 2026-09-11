import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [AccountingController],
  providers: [AccountingService, PrismaService],
})
export class AccountingModule {}
