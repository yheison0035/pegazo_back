import { Module } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { ParkingController } from './parking.controller';
import { PrismaService } from '@/prisma.service';
import { SalesModule } from '@/sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [ParkingController],
  providers: [ParkingService, PrismaService],
})
export class ParkingModule {}
