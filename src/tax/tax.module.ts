import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [TaxController],
  providers: [TaxService, PrismaService],
})
export class TaxModule {}
