import { Module } from '@nestjs/common';
import { PlatformAiService } from './platform-ai.service';
import { PlatformAiController } from './platform-ai.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [PlatformAiController],
  providers: [PlatformAiService, PrismaService],
})
export class PlatformAiModule {}
