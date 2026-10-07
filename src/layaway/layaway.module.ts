import { Module } from '@nestjs/common';
import { LayawayController } from './layaway.controller';
import { LayawayService } from './layaway.service';
import { PrismaService } from '@/prisma.service';
import { SalesModule } from '@/sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [LayawayController],
  providers: [LayawayService, PrismaService],
})
export class LayawayModule {}
