import { Module } from '@nestjs/common';
import { StockRequestsService } from './stock-requests.service';
import { StockRequestsController } from './stock-requests.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [StockRequestsController],
  providers: [StockRequestsService, PrismaService],
})
export class StockRequestsModule {}
