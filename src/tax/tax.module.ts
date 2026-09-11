import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';
import { PrismaService } from '@/prisma.service';
import { FiscalModule } from '@/fiscal/fiscal.module';

@Module({
  imports: [FiscalModule], // motor de reglas tributarias (API fiscal)
  controllers: [TaxController],
  providers: [TaxService, PrismaService],
})
export class TaxModule {}
