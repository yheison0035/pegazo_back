import { Module } from '@nestjs/common';
import { PlatformPaymentService } from './platform-payment.service';
import { PlatformPaymentController } from './platform-payment.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [PlatformPaymentController],
  providers: [PlatformPaymentService, PrismaService],
})
export class PlatformPaymentModule {}
