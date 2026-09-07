import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { PrismaService } from '@/prisma.service';
import { SalesModule } from '@/sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [StorageController],
  providers: [StorageService, PrismaService],
})
export class StorageModule {}
