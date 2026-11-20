import { Module } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PlanLimitsModule } from '@/common/plan-limits.module';
import { MailService } from '@/mail/mail.service';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoanRemindersService } from './loan-reminders.service';

// Préstamos (tipo de negocio FINANCIERA). Módulo independiente del fiado de
// ventas: no toca Sales ni Cartera. AuditService, NotificationsService y
// PushService son globales.
@Module({
  imports: [PlanLimitsModule],
  controllers: [LoansController],
  providers: [LoansService, LoanRemindersService, PrismaService, MailService],
  exports: [LoansService],
})
export class LoansModule {}
