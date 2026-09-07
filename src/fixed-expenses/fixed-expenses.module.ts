import { Module } from '@nestjs/common';
import { FixedExpensesService } from './fixed-expenses.service';
import { FixedExpensesController } from './fixed-expenses.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [FixedExpensesController],
  providers: [FixedExpensesService, PrismaService],
})
export class FixedExpensesModule {}
