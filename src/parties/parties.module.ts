import { Module } from '@nestjs/common';
import { PartiesService } from './parties.service';
import { PartiesController } from './parties.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [PartiesController],
  providers: [PartiesService, PrismaService],
})
export class PartiesModule {}
