import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PrismaService } from '@/prisma.service';
import { PlanLimitsModule } from '@/common/plan-limits.module';
import { MailService } from '@/mail/mail.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, PrismaService, MailService],
  imports: [PlanLimitsModule],
})
export class AppointmentsModule {}
