import { Module } from '@nestjs/common';
import { BusinessTypesService } from './business-types.service';
import { BusinessTypesController } from './business-types.controller';
import { PublicBusinessTypesController } from './business-types.public.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [BusinessTypesController, PublicBusinessTypesController],
  providers: [BusinessTypesService, PrismaService],
  exports: [BusinessTypesService],
})
export class BusinessTypesModule {}
